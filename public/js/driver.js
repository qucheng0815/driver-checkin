// ===== 页面切换 =====
function showPage(page) {
  document.getElementById('page-home').style.display = page === 'home' ? '' : 'none';
  document.getElementById('page-checkin').style.display = page === 'checkin' ? '' : 'none';
  document.getElementById('page-checkout').style.display = page === 'checkout' ? '' : 'none';

  if (page === 'checkout') {
    loadPendingList();
  }
}

// ===== Toast 提示 =====
function showToast(msg, duration = 2000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ===== 签到 =====
async function handleCheckin(e) {
  e.preventDefault();
  const btn = document.getElementById('btnCheckin');
  btn.disabled = true;
  btn.textContent = '提交中...';

  const data = {
    name: document.getElementById('c_name').value.trim(),
    plate: document.getElementById('c_plate').value.trim(),
    phone: document.getElementById('c_phone').value.trim(),
    company: document.getElementById('c_company').value
  };

  try {
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();

    if (result.ok) {
      showToast('✅ 签到成功！');
      document.getElementById('checkinForm').reset();
      setTimeout(() => showPage('home'), 1500);
    } else {
      showToast('❌ ' + result.msg);
    }
  } catch (err) {
    showToast('❌ 网络错误，请重试');
  } finally {
    btn.disabled = false;
    btn.textContent = '确认签到';
  }
}

// ===== 加载待签退列表 =====
let selectedId = null;

async function loadPendingList() {
  selectedId = null;
  document.getElementById('btnCheckout').style.display = 'none';

  try {
    const res = await fetch('/api/pending');
    const result = await res.json();
    const list = document.getElementById('checkoutList');

    if (!result.ok || result.data.length === 0) {
      list.innerHTML = '<li class="empty-tip">暂无待签退车辆</li>';
      return;
    }

    list.innerHTML = result.data.map(item => `
      <li class="checkout-item" data-id="${item.id}" onclick="selectItem(this, ${item.id})">
        <div>
          <div class="plate">${item.plate}</div>
          <div class="info">${item.name} · ${item.company} · ${item.checkin_time}</div>
        </div>
      </li>
    `).join('');
  } catch (err) {
    showToast('❌ 加载失败，请重试');
  }
}

function selectItem(el, id) {
  document.querySelectorAll('.checkout-item').forEach(i => i.classList.remove('selected'));
  el.classList.add('selected');
  selectedId = id;
  document.getElementById('btnCheckout').style.display = '';
}

// ===== 签退 =====
async function handleCheckout() {
  if (!selectedId) {
    showToast('请先选择车辆');
    return;
  }

  const btn = document.getElementById('btnCheckout');
  btn.disabled = true;
  btn.textContent = '提交中...';

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedId })
    });
    const result = await res.json();

    if (result.ok) {
      showToast('✅ 签退成功！');
      setTimeout(() => showPage('home'), 1500);
    } else {
      showToast('❌ ' + result.msg);
    }
  } catch (err) {
    showToast('❌ 网络错误，请重试');
  } finally {
    btn.disabled = false;
    btn.textContent = '确认签退';
  }
}
