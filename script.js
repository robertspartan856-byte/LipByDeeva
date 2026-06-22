document.addEventListener('DOMContentLoaded', () => {
  // ===== PAYSTACK CONFIGURATION =====
  const PAYSTACK_PUBLIC_KEY = 'pk_live_10a44c173a1d5331fa2243a57c5c493fccc17f06';
  const BACKEND_URL = 'http://localhost:3000/api';
  
  // ===== PAYSTACK PAYMENT HANDLER =====
  async function initializePaystack(email, amount, metadata) {
    try {
      const response = await fetch(`${BACKEND_URL}/initialize-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amount,
          reference: `ref-${Date.now()}`,
          metadata
        })
      });

      const data = await response.json();
      if (!data.status) throw new Error(data.error);

      return data;
    } catch (error) {
      console.error('Paystack initialization error:', error);
      throw error;
    }
  }

  async function verifyPayment(reference) {
    try {
      const response = await fetch(`${BACKEND_URL}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference })
      });

      const data = await response.json();
      if (!data.status) throw new Error(data.error);

      return data;
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  // ===== CARD PAYMENT MODAL - PAYSTACK VERSION =====
  const cardModal = document.querySelector('#card-payment-modal');
  const cardForm = document.querySelector('#card-form');
  const modalClose = document.querySelector('.modal-close');
  const modalOverlay = document.querySelector('.modal-overlay');

  function closeCardModal() {
    if (cardModal) cardModal.classList.add('hidden');
  }

  function openCardModal() {
    if (cardModal) cardModal.classList.remove('hidden');
  }

  if (modalClose) modalClose.addEventListener('click', closeCardModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeCardModal);

  // Store checkout data for payment processing
  let pendingCheckoutData = null;

  if (cardForm) {
    cardForm.addEventListener('submit', async event => {
      event.preventDefault();
      
      if (!pendingCheckoutData) {
        alert('Please complete checkout form first.');
        return;
      }

      const submitBtn = cardForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';

      try {
        // Initialize Paystack payment
        const initResult = await initializePaystack(
          pendingCheckoutData.email,
          pendingCheckoutData.total,
          {
            customer_name: pendingCheckoutData.name,
            shipping_address: pendingCheckoutData.address,
            phone: pendingCheckoutData.phone,
            cart_items: pendingCheckoutData.items
          }
        );

        // Use Paystack's inline payment handler
        const handler = PaystackPop.setup({
          key: PAYSTACK_PUBLIC_KEY,
          email: pendingCheckoutData.email,
          amount: pendingCheckoutData.total * 100, // Convert to kobo
          ref: initResult.reference,
          currency: 'NGN',
          onClose: function() {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            console.log('Payment modal closed');
          },
          onSuccess: async function(response) {
            try {
              // Verify payment on backend
              const verifyResult = await verifyPayment(response.reference);
              
              if (verifyResult.status) {
                alert(`Payment successful! Order ID: ${verifyResult.order.id}`);
                // Clear cart and redirect
                localStorage.removeItem('lb_cart');
                renderCartBadge();
                window.location.href = '../index.html';
              }
            } catch (error) {
              alert('Payment verified but there was an issue. Please contact support.');
              console.error(error);
            }
          }
        });
        handler.openIframe();

      } catch (error) {
        alert(`Payment error: ${error.message}`);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // ===== CART FUNCTIONS =====
  const productSearch = document.querySelector('#product-search');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const productGrid = document.querySelector('#product-grid');
  let currentFilter = 'all';
  let searchTerm = '';

  function getProductCategory(productName) {
    if (productName.includes('Gloss') || productName.includes('Nude') || productName.includes('Honey') || productName.includes('Pink') || productName.includes('Cocoa')) return 'gloss';
    if (productName.includes('Lash') || productName.includes('Everyday') || productName.includes('Luxury')) return 'lashes';
    if (productName.includes('Tattoo')) return 'tattoo';
    return 'all';
  }

  function filterProducts() {
    if (!productGrid) return;
    const cards = productGrid.querySelectorAll('.product-card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      const category = getProductCategory(card.textContent);
      const matchesSearch = text.includes(searchTerm.toLowerCase());
      const matchesFilter = currentFilter === 'all' || category === currentFilter;
      card.style.display = (matchesSearch && matchesFilter) ? 'block' : 'none';
    });
  }

  if (productSearch) {
    productSearch.addEventListener('input', e => {
      searchTerm = e.target.value;
      filterProducts();
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      filterProducts();
    });
  });

  const newsletterForm = document.querySelector('.newsletter form');
  const emailInput = newsletterForm ? newsletterForm.querySelector('input[type="email"]') : null;
  const mobileMenuButton = document.querySelector('.mobile-menu-button');
  const nav = document.querySelector('header nav');
  const faqItems = document.querySelectorAll('.faq-item');

  if (newsletterForm && emailInput) {
    newsletterForm.addEventListener('submit', event => {
      event.preventDefault();
      const email = emailInput.value.trim();
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        alert('Please enter a valid email address.');
        return;
      }
      alert('Thank you for subscribing, ' + email + '!');
      newsletterForm.reset();
    });
  }

  if (mobileMenuButton && nav) {
    mobileMenuButton.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      mobileMenuButton.setAttribute('aria-expanded', String(isOpen));
      mobileMenuButton.classList.toggle('open', isOpen);
    });
  }

  function getCartQuantity() {
    return getCart().reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }

  function renderCartBadge() {
    const qty = getCartQuantity();
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = qty;
      el.style.display = qty ? 'inline-flex' : 'none';
    });
  }

  function getCartLinkHref() {
    const path = window.location.pathname.split('/').filter(Boolean);
    if (path.includes('shop')) {
      return path.includes('products') ? '../cart.html' : 'cart.html';
    }
    return 'shop/cart.html';
  }

  function injectCartLink() {
    const headerNav = document.querySelector('header nav');
    if (!headerNav || document.querySelector('.cart-link')) return;
    const link = document.createElement('a');
    link.className = 'cart-link';
    link.href = getCartLinkHref();
    link.setAttribute('aria-label', 'View cart');
    link.innerHTML = '<span class="cart-icon" aria-hidden="true">🛍️</span> <span class="cart-label">Cart</span> <span class="cart-count">0</span>';
    headerNav.insertAdjacentElement('afterend', link);
    renderCartBadge();
  }

  injectCartLink();

  faqItems.forEach(item => {
    const question = item.querySelector('h3');
    const answer = item.querySelector('p');
    if (!question || !answer) return;
    answer.style.display = 'none';
    question.addEventListener('click', () => {
      const isOpen = answer.style.display === 'block';
      answer.style.display = isOpen ? 'none' : 'block';
      question.classList.toggle('open', !isOpen);
    });
  });

  /* -----------------------
     Simple client-side cart
     Stores cart in localStorage under `lb_cart`
     ----------------------- */

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('lb_cart') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem('lb_cart', JSON.stringify(cart));
  }

  function animateCartBadge() {
    document.querySelectorAll('.cart-count').forEach(el => {
      el.classList.remove('cart-badge-pop');
      void el.offsetWidth;
      el.classList.add('cart-badge-pop');
    });
  }

  function addToCart(item) {
    const cart = getCart();
    const existing = cart.find(i => i.id === item.id && i.variant === item.variant);
    if (existing) {
      existing.qty = (existing.qty || 1) + (item.qty || 1);
    } else {
      cart.push(Object.assign({qty: 1}, item));
    }
    saveCart(cart);
    renderCartBadge();
    animateCartBadge();
    return cart;
  }

  function removeFromCart(id, variant) {
    let cart = getCart();
    cart = cart.filter(i => !(i.id === id && i.variant === variant));
    saveCart(cart);
    return cart;
  }

  function updateQty(id, variant, qty) {
    const cart = getCart();
    const item = cart.find(i => i.id === id && i.variant === variant);
    if (item) {
      item.qty = Math.max(1, Number(qty) || 1);
      saveCart(cart);
    }
    return cart;
  }

  // Attach add-to-cart handlers on product pages
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', event => {
      event.preventDefault();
      const id = btn.getAttribute('data-id') || btn.dataset.id;
      const name = btn.getAttribute('data-name') || btn.dataset.name || '';
      const price = Number(btn.getAttribute('data-price') || btn.dataset.price || 0);
      const img = btn.getAttribute('data-img') || btn.dataset.img || '';
      const container = btn.closest('.product-card') || document;
      const variantSelect = container.querySelector('.variant-select');
      const variant = variantSelect ? variantSelect.value : (btn.getAttribute('data-variant') || btn.dataset.variant || 'Default');
      const qtyInput = container.querySelector('.qty-input');
      const qty = qtyInput ? Math.max(1, Number(qtyInput.value) || 1) : 1;
      addToCart({id, name, price, img, variant, qty});
      window.location.href = '../cart.html';
    });
  });

  // If on cart page, render cart
  const cartContainer = document.querySelector('#cart-items');
  if (cartContainer) {
    function renderCart() {
      const cart = getCart();
      cartContainer.innerHTML = '';
      if (!cart.length) {
        cartContainer.innerHTML = '<p>Your cart is empty.</p>';
        const totalEl = document.querySelector('#cart-total'); if (totalEl) totalEl.textContent = '₦0';
        return;
      }
      let total = 0;
      cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-row';
        row.innerHTML = `\
          <div class="cart-item">\
            <img src="${item.img}" alt="${item.name}" style="width:84px;height:64px;object-fit:cover;border-radius:8px;margin-right:12px;" />\
            <div>\
              <strong>${item.name}</strong>\
              <div class="muted">${item.variant}</div>\
              <div class="muted">₦${(item.price||0).toLocaleString()}</div>\
            </div>\
          </div>\
          <div class="cart-actions">\
            <input type="number" class="cart-qty" min="1" value="${item.qty}" data-id="${item.id}" data-variant="${item.variant}" />\
            <button class="remove-cart" data-id="${item.id}" data-variant="${item.variant}">Remove</button>\
          </div>\
        `;
        cartContainer.appendChild(row);
        total += (item.price || 0) * (item.qty || 1);
      });
      const totalEl = document.querySelector('#cart-total'); if (totalEl) totalEl.textContent = '₦' + total.toLocaleString();

      // wire qty and remove
      cartContainer.querySelectorAll('.cart-qty').forEach(input => {
        input.addEventListener('change', e => {
          const id = e.target.dataset.id;
          const variant = e.target.dataset.variant;
          const qty = Number(e.target.value) || 1;
          updateQty(id, variant, qty);
          renderCart();
        });
      });
      cartContainer.querySelectorAll('.remove-cart').forEach(btn => {
        btn.addEventListener('click', e => {
          const id = e.target.dataset.id;
          const variant = e.target.dataset.variant;
          removeFromCart(id, variant);
          renderCart();
        });
      });
    }
    renderCart();
  }

  const checkoutCartItems = document.querySelector('#checkout-cart-items');
  const checkoutTotalEl = document.querySelector('#checkout-total');
  const checkoutForm = document.querySelector('#checkout-form');
  const paymentSummary = document.querySelector('#payment-summary');

  function updatePaymentSummary() {
    if (!paymentSummary || !checkoutForm) return;
    const paymentSelect = checkoutForm.querySelector('select[name="payment"]');
    if (!paymentSelect) return;
    const selected = paymentSelect.value;
    paymentSummary.textContent = selected
      ? `Pay with ${paymentSelect.options[paymentSelect.selectedIndex].text}.`
      : 'Choose a payment method to continue.';
  }

  function renderCheckoutSummary() {
    if (!checkoutCartItems || !checkoutTotalEl) return;
    const cart = getCart();
    checkoutCartItems.innerHTML = '';
    let total = 0;
    if (!cart.length) {
      checkoutCartItems.innerHTML = '<p>Your cart is empty. Add items before checking out.</p>';
      checkoutTotalEl.textContent = '₦0';
      return;
    }
    cart.forEach(item => {
      const itemRow = document.createElement('div');
      itemRow.className = 'checkout-item';
      itemRow.innerHTML = `
        <strong>${item.name}</strong>
        <div class="muted">${item.variant} × ${item.qty}</div>
        <div class="muted">₦${((item.price || 0) * (item.qty || 1)).toLocaleString()}</div>
      `;
      checkoutCartItems.appendChild(itemRow);
      total += (item.price || 0) * (item.qty || 1);
    });
    checkoutTotalEl.textContent = '₦' + total.toLocaleString();
  }

  if (checkoutForm) {
    renderCheckoutSummary();
      updatePaymentSummary();
      const paymentSelect = checkoutForm.querySelector('select[name="payment"]');
      if (paymentSelect) {
        paymentSelect.addEventListener('change', updatePaymentSummary);
      }
      checkoutForm.addEventListener('submit', event => {
        event.preventDefault();
        const cart = getCart();
        if (!cart.length) {
          alert('Your cart is empty. Add items before placing an order.');
          return;
        }
        const formData = new FormData(checkoutForm);
        const name = (formData.get('name') || '').toString().trim();
        const email = (formData.get('email') || '').toString().trim();
        const address = (formData.get('address') || '').toString().trim();
        const phone = (formData.get('phone') || '').toString().trim();
        const payment = (formData.get('payment') || '').toString().trim();
        const notes = (formData.get('notes') || '').toString().trim();
        
        if (!name || !email || !address || !payment) {
          alert('Please fill in your name, email, shipping address, and payment method.');
          return;
        }

        // Calculate total
        let total = 0;
        cart.forEach(item => {
          total += (item.price || 0) * (item.qty || 1);
        });

        // Store checkout data for payment processing
        pendingCheckoutData = {
          name,
          email,
          address,
          phone,
          payment,
          notes,
          total,
          items: cart
        };

        if (payment === 'card') {
          // Open Paystack payment modal
          openCardModal();
          return;
        }

        // Other payment methods (bank transfer, cash on delivery)
        localStorage.removeItem('lb_cart');
        renderCartBadge();
        alert(`Thank you, ${name}! Your order has been placed successfully.\n\nPayment Method: ${payment === 'transfer' ? 'Bank Transfer' : 'Cash on Delivery'}\n\nWe'll contact you shortly to confirm your order.`);
        window.location.href = '../index.html';
      });
    }

});
