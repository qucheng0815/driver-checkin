// ===== Toast =====
function showToast(msg, duration) {
  duration = duration || 2000;
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, duration);
}

// ===== 登录 =====
function handleLogin(e) {
  e.preventDefault();
  var pwd = document.getElementById('adminPwd').value;

  fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: pwd })
  })
  .then(function(res) { return res.json(); })
  .then(function(result) {
    if (result.ok) {
      sessionStorage.setItem('admin_auth', '1');
      document.getElementById('loginPage').style.display = 'none';
      document.getElementById('adminPage').style.display = '';
      loadCurrent();
    } else {
      showToast('❌ ' + result.msg);
    }
  })
  .catch(function() {
    showToast('❌ 网络错误');
  });

  return false;
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
  var btns = document.querySelectorAll('.tab-btn');
  for (var i = 0; i < btns.length; i++) { btns[i].classList.remove('active'); }
  btn.classList.add('active');

  document.getElementById('tab-current').style.display = tab === 'current' ? '' : 'none';
  document.getElementById('tab-history').style.display = tab === 'history' ? '' : 'none';

  if (tab === 'current') loadCurrent();
  if (tab === 'history') loadHistory(1);
}

// ===== 当前在场 =====
function loadCurrent() {
  fetch('/api/admin/current')
  .then(function(res) { return res.json(); })
  .then(function(result) {
    var tbody = document.getElementById('currentBody');

    if (!result.ok || result.data.length === 0) {
      tbody.innerHTML = '';
      document.getElementById('currentEmpty').style.display = '';
      document.getElementById('currentTable').style.display = 'none';
      document.getElementById('currentCount').textContent = '当前在场：0 辆';
      return;
    }

    document.getElementById('currentEmpty').style.display = 'none';
    document.getElementById('currentTable').style.display = '';
    document.getElementById('currentCount').textContent = '当前在场：' + result.data.length + ' 辆';

    tbody.innerHTML = result.data.map(function(r) {
      return '<tr>' +
        '<td><strong>' + r.plate + '</strong></td>' +
        '<td>' + r.name + '</td>' +
        '<td>' + r.company + '</td>' +
        '<td>' + r.checkin_time + '</td>' +
      '</tr>';
    }).join('');
  })
  .catch(function() {
    showToast('❌ 加载失败');
  });
}

// ===== 历史记录 =====
var currentPage = 1;
var PAGE_SIZE = 50;

function loadHistory(page) {
  currentPage = page;
  var date = document.getElementById('filterDate').value;
  var url = '/api/admin/history?page=' + page + '&size=' + PAGE_SIZE;
  if (date) url += '&date=' + date;

  fetch(url)
  .then(function(res) { return res.json(); })
  .then(function(result) {
    var tbody = document.getElementById('historyBody');

    if (!result.ok || result.data.length === 0) {
      tbody.innerHTML = '';
      document.getElementById('historyEmpty').style.display = '';
      document.getElementById('historyTable').style.display = 'none';
      document.getElementById('paginationBar').style.display = 'none';
      return;
    }

    document.getElementById('historyEmpty').style.display = 'none';
    document.getElementById('historyTable').style.display = '';

    tbody.innerHTML = result.data.map(function(r) {
      return '<tr>' +
        '<td><strong>' + r.plate + '</strong></td>' +
        '<td>' + r.name + '</td>' +
        '<td>' + r.company + '</td>' +
        '<td>' + r.phone + '</td>' +
        '<td>' + r.checkin_time + '</td>' +
        '<td>' + (r.checkout_time || '-') + '</td>' +
        '<td class="' + (r.checkout_time ? 'status-out' : 'status-in') + '">' +
          (r.checkout_time ? '已离场' : '在场中') +
        '</td>' +
      '</tr>';
    }).join('');

    // 分页
    var totalPages = Math.ceil(result.total / PAGE_SIZE);
    if (totalPages > 1) {
      document.getElementById('paginationBar').style.display = '';
      document.getElementById('pageInfo').textContent = '第 ' + page + ' / ' + totalPages + ' 页';
      document.getElementById('btnPrev').disabled = page <= 1;
      document.getElementById('btnNext').disabled = page >= totalPages;
    } else {
      document.getElementById('paginationBar').style.display = 'none';
    }
  })
  .catch(function() {
    showToast('❌ 加载失败');
  });
}

function changePage(delta) {
  loadHistory(currentPage + delta);
}

function clearFilter() {
  document.getElementById('filterDate').value = '';
  loadHistory(1);
}
