function showPage(page) {
  document.getElementById('page-home').style.display = page === 'home' ? '' : 'none';
  document.getElementById('page-checkin').style.display = page === 'checkin' ? '' : 'none';
  document.getElementById('page-checkout').style.display = page === 'checkout' ? '' : 'none';
  if (page === 'checkout') loadPendingList();
}

function showToast(msg, duration) {
  duration = duration || 2000;
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, duration);
}

function handleCheckin(e) {
  e.preventDefault();
  var btn = document.getElementById('btnCheckin');
  btn.disabled = true;
  btn.textContent = '提交中...';

  var data = {
    name: document.getElementById('c_name').value.trim(),
    plate: document.getElementById('c_plate').value.trim(),
    phone: document.getElementById('c_phone').value.trim(),
    company: document.getElementById('c_company').value
  };

  fetch('/api/checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(function(r) { return r.json(); })
  .then(function(result) {
    if (result.ok) {
      showToast('✅ 签到成功！');
      document.getElementById('checkinForm').reset();
      setTimeout(function() { showPage('home'); }, 1500);
    } else {
      showToast('❌ ' + result.msg);
    }
  })
  .catch(function() { showToast('❌ 网络错误，请重试'); })
  .finally(function() { btn.disabled = false; btn.textContent = '确认签到'; });
  return false;
}

var selectedId = null;

function loadPendingList() {
  selectedId = null;
  document.getElementById('btnCheckout').style.display = 'none';
  fetch('/api/pending')
  .then(function(r) { return r.json(); })
  .then(function(result) {
    var list = document.getElementById('checkoutList');
    if (!result.ok || result.data.length === 0) {
      list.innerHTML = '<li class="empty-tip">暂无待签退车辆</li>';
      return;
    }
    list.innerHTML = result.data.map(function(item) {
      return '<li class="checkout-item" data-id="' + item.id + '" onclick="selectItem(this,' + item.id + ')">' +
        '<div><div class="plate">' + item.plate + '</div>' +
        '<div class="info">' + item.name + ' · ' + item.company + ' · ' + item.checkin_time + '</div></div></li>';
    }).join('');
  })
  .catch(function() { showToast('❌ 加载失败，请重试'); });
}

function selectItem(el, id) {
  var items = document.querySelectorAll('.checkout-item');
  for (var i = 0; i < items.length; i++) items[i].classList.remove('selected');
  el.classList.add('selected');
  selectedId = id;
  document.getElementById('btnCheckout').style.display = '';
}

function handleCheckout() {
  if (!selectedId) { showToast('请先选择车辆'); return; }
  var btn = document.getElementById('btnCheckout');
  btn.disabled = true;
  btn.textContent = '提交中...';

  fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: selectedId })
  })
  .then(function(r) { return r.json(); })
  .then(function(result) {
    if (result.ok) {
      showToast('✅ 签退成功！');
      setTimeout(function() { showPage('home'); }, 1500);
    } else { showToast('❌ ' + result.msg); }
  })
  .catch(function() { showToast('❌ 网络错误，请重试'); })
  .finally(function() { btn.disabled = false; btn.textContent = '确认签退'; });
}
