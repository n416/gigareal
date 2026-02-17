// Contact Modal Logic
const modal = document.getElementById('contact-modal');
const openBtns = document.querySelectorAll('#open-contact, #nav-contact-btn, #mobile-contact-btn');
const closeBtn = document.getElementById('close-contact');
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

// Mobile Menu Logic
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
  });

  // Close menu when link is clicked
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
    });
  });
}


// Open Modal
openBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    // Small delay to allow display:block to apply before opacity transition
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);
  });
});

// Close Modal
function closeModal() {
  modal.classList.remove('active');
  setTimeout(() => {
    modal.classList.add('hidden');
    formStatus.textContent = ''; // Clear status on close
    formStatus.className = 'status-message';
  }, 300); // Match CSS transition duration
}

closeBtn.addEventListener('click', closeModal);

// Close on click outside
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Form Submission
contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const data = new FormData(form);

  formStatus.textContent = '送信中...';
  formStatus.className = 'status-message';

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      body: data
    });

    const result = await response.json();

    if (response.ok) {
      formStatus.textContent = result.message || 'メッセージが送信されました！ありがとうございます。';
      formStatus.className = 'status-message success';
      form.reset();
      setTimeout(closeModal, 2000);
    } else {
      if (result.error) {
        formStatus.textContent = `エラー: ${result.error}`;
      } else {
        formStatus.textContent = '送信中にエラーが発生しました。';
      }
      formStatus.className = 'status-message error';
    }
  } catch (error) {
    console.error(error);
    formStatus.textContent = 'ネットワークエラーが発生しました。';
    formStatus.className = 'status-message error';
  }
});
