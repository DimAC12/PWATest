// Проверка поддержки PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker зарегистрирован:', registration);
                updateStatus('PWA готово к работе! ✅');
            })
            .catch(error => {
                console.log('Ошибка регистрации ServiceWorker:', error);
                updateStatus('Ошибка PWA ❌');
            });
    });
}

// Обновление статуса подключения
function updateStatus(message) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    
    if (navigator.onLine) {
        statusElement.className = 'status online';
    } else {
        statusElement.className = 'status offline';
    }
}

// Слушатель событий онлайн/офлайн
window.addEventListener('online', () => {
    updateStatus('Вернулись в онлайн! 🌐');
});

window.addEventListener('offline', () => {
    updateStatus('Работаем офлайн 📴');
});

// Обработка установки приложения
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Предотвращаем автоматическое показывание приглашения
    e.preventDefault();
    // Сохраняем событие для последующего использования
    deferredPrompt = e;
    
    // Показываем кнопку установки
    const installBtn = document.getElementById('installBtn');
    installBtn.style.display = 'block';
    
    installBtn.addEventListener('click', async () => {
        installBtn.style.display = 'none';
        
        // Показываем приглашение установки
        deferredPrompt.prompt();
        
        // Ждем ответа пользователя
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log(`Результат установки: ${outcome}`);
        deferredPrompt = null;
    });
});

// Проверка, установлено ли приложение
window.addEventListener('appinstalled', () => {
    console.log('PWA успешно установлено!');
    updateStatus('Приложение установлено! 🎉');
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    if (navigator.onLine) {
        updateStatus('Онлайн режим 🌐');
    } else {
        updateStatus('Офлайн режим 📴');
    }
});