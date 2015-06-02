var isPushEnabled = false;

window.addEventListener('load', function () {
    var pushButton = document.querySelector('.js-push-button');
    pushButton.addEventListener('click', function () {
        if (isPushEnabled) {
            unsbscribe();
        } else {
            subscribe();
        }
    });

    document.querySelector('.js-unregist-serviceworker').addEventListener('click', function () {
        navigator.serviceWorker.getRegistration().then(function (registration) {
            registration.unregister().then(function () {
                console.log('service workler became unregisted.');
            });
        })
    });

    // check service workkers are supported, if so, progressively
    // enhance and add push messaging support, otherwise continue without it.
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(initializeState);
    } else {
        alert('Service workers are not supported in this browser.');
    }
});


// Once the service worker is registerd set the initial state.
function initializeState () {
    // Are Notifications supported in the service worker?
    if (('showNotification' in ServiceWorkerRegistration.prototype) === false) {
        alert('Notifications are not supported');
        return;
    }

    // Check the current Notification permission.
    // If its denied, it's a permanent block untile the
    // user changes the permission
    if (Notification.permission === 'denied') {
        alert('The user has blocked notifications.');
        return;
    }

    // Check if push messaging is supported
    if (('PushManager' in window) === false) {
        alert('Push messaging is not supported.');
        return;
    }

    // We need the service worker registration to check for a subscription.
    navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
        console.debug('serviceWorker ready');
        // Do we already have a push message subscription?
        serviceWorkerRegistration.pushManager.getSubscription().then(function (subscription) {
            // Enable any UI which subscribes / unsubscribes
            // from push messages.
            var pushButton = document.querySelector('.js-push-button');
            pushButton.disabled = false;

            if (!subscription) {
                // We are not subscribed to push, so set UI
                // to allow the user to enable push
                return;
            }

            // Keep your server in sync with the latest subscriptionId
            sendSubscriptionToServer(subscription);

            // Set your UI to show they have subscribed for push messages.
            pushButton.textContent = 'Disable Push Messages';
            isPushEnabled = true;

        }).catch(function (err) {
            alert('Error during getSubscription()');
            console.warn('Error during getSubscription()', err);
        });
    });
}























