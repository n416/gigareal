// Contact Modal Logic
const modal = document.getElementById('contact-modal');
const openBtn = document.getElementById('open-contact');
const closeBtn = document.getElementById('close-contact');
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

// Open Modal
openBtn.addEventListener('click', () => {
  modal.classList.remove('hidden');
  // Small delay to allow display:block to apply before opacity transition
  setTimeout(() => {
    modal.classList.add('active');
  }, 10);
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
  const action = form.action;

  // Check if form ID is configured
  if (action.includes('YOUR_FORM_ID')) {
    formStatus.textContent = 'エラー: 送信先が設定されていません。管理者に連絡してください。';
    formStatus.className = 'status-message error';
    return;
  }

  formStatus.textContent = '送信中...';
  formStatus.className = 'status-message';

  try {
    const response = await fetch(action, {
      method: 'POST',
      body: data,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      formStatus.textContent = 'メッセージが送信されました！ありがとうございます。';
      formStatus.className = 'status-message success';
      form.reset();
      setTimeout(closeModal, 2000);
    } else {
      const result = await response.json();
      if (Object.hasOwn(result, 'errors')) {
        formStatus.textContent = result.errors.map(error => error.message).join(", ");
      } else {
        formStatus.textContent = '送信中にエラーが発生しました。';
      }
      formStatus.className = 'status-message error';
    }
  } catch (error) {
    formStatus.textContent = 'ネットワークエラーが発生しました。';
    formStatus.className = 'status-message error';
  }
});
