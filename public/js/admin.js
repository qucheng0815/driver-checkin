// ===== Toast =====
function showToast(msg, duration = 2000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ===== 登录 =====
async function handleLogin(e) {
  e.preventDefault();
  const pwd = document.getElementById('adminPwd').value;

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd })
    });
    const result = await res.json();

    if (result.ok) {
      sessionStorage.setItem('admin_auth', '1');
      document.getElementById('loginPage').style.display = 'none';
      document.getElementById('adminPage').style.display = '';
      loadCurrent();
    } else {
      showToast('❌ ' + result.msg);
    }
  } catch (err) {
    showToast('❌ 网络错误');
  }
}

// 页面加载时检查登录状态
window.onload = function () {
  if (sessionStorage.getItem('admin_auth') === '1') {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('adminPage').style.display = '';
    loadCurrent();
  }
};

// ===== Tab 切换 =====
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.getElementById('tab-current').style.display = tab === 'current' ? '' : 'none';
  document.getElementById('tab-history').style.display = tab === 'history' ? '' : 'none';

  if (tab === 'current') loadCurrent();
  if (tab === 'history') loadHistory(1);
}

// ===== 当前在场 =====
async function loadCurrent() {
  try {
    const res = await fetch('/api/admin/current');
    const result = await res.json();
    const tbody = document.getElementById('currentBody');

    if (!result.ok || result.data.length === 0) {
      tbody.innerHTML = '';
      document.getElementById('currentEmpty').style.display = '';
      document.getElementById('currentTable').style.display = 'none';
      document.getElementById('currentCount').textContent = '当前在场：0 辆';
      return;
    }

    document.getElementById('currentEmpty').style.display = 'none';
    document.getElementById('currentTable').style.display = '';
    document.getElementById('currentCount').textContent = `当前在场：${result.data.length} 辆`;

    tbody.innerHTML = result.data.map(r => `
      <tr>
        <td><strong>${r.plate}</strong></td>
        <td>${r.name}</td>
        <td>${r.company}</td>
        <td>${r.checkin_time}</td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('❌ 加载失败');
  }
}

// ===== 历史记录 =====
let currentPage = 1;
const PAGE_SIZE = 50;

async function loadHistory(page) {
  currentPage = page;
  const date = document.getElementById('filterDate').value;
  let url = `/api/admin/history?page=${page}&size=${PAGE_SIZE}`;
  if (date) url += `&date=${date}`;

  try {
    const res = await fetch(url);
    const result = await res.json();
    const tbody = document.getElementById('historyBody');

    if (!result.ok || result.data.length === 0) {
      tbody.innerHTML = '';
      document.getElementById('historyEmpty').style.display = '';
      document.getElementById('historyTable').style.display = 'none';
      document.getElementById('paginationBar').style.display = 'none';
      return;
    }

    document.getElementById('historyEmpty').style.display = 'none';
    document.getElementById('historyTable').style.display = '';

    tbody.innerHTML = result.data.map(r => `
      <tr>
        <td><strong>${r.plate}</strong></td>
        <td>${r.name}</td>
        <td>${r.company}</td>
        <td>${r.phone}</td>
        <td>${r.checkin_time}</td>
        <td>${r.checkout_time || '-'}</td>
        <td class="${r.checkout_time ? 'status-out' : 'status-in'}">
          ${r.checkout_time ? '已离场' : '在场中'}
        </td>
      </tr>
    `).join('');

    // 分页
    const totalPages = Math.ceil(result.total / PAGE_SIZE);
    if (totalPages > 1) {
      document.getElementById('paginationBar').style.display = '';
      document.getElementById('pageInfo').textContent = `第 ${page} / ${totalPages} 页`;
      document.getElementById('btnPrev').disabled = page <= 1;
      document.getElementById('btnNext').disabled = page >= totalPages;
    } else {
      document.getElementById('paginationBar').style.display = 'none';
    }
  } catch (err) {
    showToast('❌ 加载失败');
  }
}

function changePage(delta) {
  loadHistory(currentPage + delta);
}

function clearFilter() {
  document.getElementById('filterDate').value = '';
  loadHistory(1);
}
