const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('🧪 Starting Khayal Kalolsavam API & Feature Test Suite...\n');
  const baseUrl = 'http://localhost:3000';

  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failCount++;
    }
  }

  try {
    // 1. Check Stats
    const statsRes = await fetch(`${baseUrl}/api/stats`);
    const statsData = await statsRes.json();
    assert(statsData.success && statsData.data.total === 38, `Stats API returns total 38 items (Got: ${statsData.data?.total})`);
    assert(statsData.data.arabicTotal === 11, `Stats API returns 11 Arabic items (Got: ${statsData.data?.arabicTotal})`);
    assert(statsData.data.generalTotal === 27, `Stats API returns 27 General items (Got: ${statsData.data?.generalTotal})`);

    // 2. Check Items List
    const itemsRes = await fetch(`${baseUrl}/api/items`);
    const itemsData = await itemsRes.json();
    assert(itemsData.success && itemsData.count === 38, `GET /api/items returns 38 items (Count: ${itemsData.count})`);

    // 3. Check Category Filter
    const arabicRes = await fetch(`${baseUrl}/api/items?category=HS%20Arabic`);
    const arabicData = await arabicRes.json();
    assert(arabicData.count === 11, `Filter HS Arabic returns 11 items (Count: ${arabicData.count})`);

    // 4. Check Malayalam / English Search
    const searchRes = await fetch(`${baseUrl}/api/items?search=Oppana`);
    const searchData = await searchRes.json();
    assert(searchData.count >= 1 && searchData.data[0].itemCode === '670', `Search "Oppana" returns item #670`);

    const searchMlRes = await fetch(`${baseUrl}/api/items?search=%E0%B4%92%E0%B4%AA%E0%B5%8D%E0%B4%AA%E0%B4%A8`); // ഒപ്പന
    const searchMlData = await searchMlRes.json();
    assert(searchMlData.count >= 1 && searchMlData.data[0].itemCode === '670', `Search Malayalam "ഒപ്പന" returns item #670`);

    // 5. Test Admin Login (Invalid Password)
    const badLoginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrongpassword' })
    });
    assert(badLoginRes.status === 401, 'Admin login rejects incorrect password with 401');

    // 6. Test Admin Login (Valid Password)
    const goodLoginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'admin123' })
    });
    const goodLoginData = await goodLoginRes.json();
    assert(goodLoginRes.ok && goodLoginData.token, 'Admin login succeeds with admin123 and returns session token');
    const adminToken = goodLoginData.token;

    // 7. Verify Admin Token
    const verifyRes = await fetch(`${baseUrl}/api/admin/verify`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(verifyRes.ok, 'Token verification endpoint succeeds');

    // 8. Test Uploading PDF Result for Item 601 (Chithra Rachana - Pencil)
    const pdfPath = path.join(__dirname, 'sample_test_result.pdf');
    const pdfBlob = new Blob([fs.readFileSync(pdfPath)], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('resultPdf', pdfBlob, '601_Chithra_Rachana_Pencil.pdf');

    const uploadRes = await fetch(`${baseUrl}/api/admin/items/item_601/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: formData
    });
    const uploadData = await uploadRes.json();
    assert(uploadData.success && uploadData.data.hasResult === true, 'Upload PDF result for item 601 succeeds');
    assert(uploadData.data.resultPdf.url.endsWith('.pdf'), `Result PDF URL is properly set: ${uploadData.data?.resultPdf?.url}`);

    // 9. Verify PDF is served and accessible
    const pdfUrl = `${baseUrl}${uploadData.data.resultPdf.url}`;
    const fileRes = await fetch(pdfUrl);
    const contentType = fileRes.headers.get('content-type');
    assert(fileRes.ok && contentType.includes('application/pdf'), `PDF file is served successfully with Content-Type: ${contentType}`);

    // 10. Check Stats after publishing
    const statsAfterRes = await fetch(`${baseUrl}/api/stats`);
    const statsAfter = await statsAfterRes.json();
    assert(statsAfter.data.published === 1 && statsAfter.data.pending === 37, `Stats updated: 1 published, 37 pending`);

    // 11. Test Adding New Item via Admin
    const addItemRes = await fetch(`${baseUrl}/api/admin/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        itemCode: '999',
        itemName: 'Test Cultural Event',
        itemNameMl: 'ടെസ്റ്റ് സാംസ്കാരിക ഇനം',
        category: 'HS General',
        participants: 4
      })
    });
    const addItemData = await addItemRes.json();
    assert(addItemData.success && addItemData.data.itemCode === '999', 'Admin can add a new item (#999)');

    // 12. Test Updating Item via Admin
    const updateItemRes = await fetch(`${baseUrl}/api/admin/items/${addItemData.data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        itemName: 'Updated Cultural Event'
      })
    });
    const updateItemData = await updateItemRes.json();
    assert(updateItemData.success && updateItemData.data.itemName === 'Updated Cultural Event', 'Admin can update an item');

    // 13. Test Deleting Item via Admin
    const deleteItemRes = await fetch(`${baseUrl}/api/admin/items/${addItemData.data.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const deleteItemData = await deleteItemRes.json();
    assert(deleteItemData.success, 'Admin can delete an item');

    // 14. Test Export Backup
    const exportRes = await fetch(`${baseUrl}/api/admin/export`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const exportData = await exportRes.json();
    assert(exportData.items && exportData.items.length === 38, `Export backup JSON returns complete data (${exportData.items?.length} items)`);

    console.log(`\n========================================`);
    console.log(`Test Results: ${passCount} Passed, ${failCount} Failed`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runTests();
