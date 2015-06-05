// http://updates.html5rocks.com/2015/03/push-notificatons-on-the-open-web
// http://qiita.com/tomoyukilabs/items/8fffb4280c1914b6aa3d

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
            console.debug('aaaaaaaa: ', subscription);
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


function subscribe() {
    // Disable the button so it can't be changed
    // while we process the permission request.
    var pushButton = document.querySelector('.js-push-button');
    pushButton.disabled = true;

    navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {

        serviceWorkerRegistration.pushManager.subscribe({userVisibleOnly: true}).then(function (subscription) {
            // The subscription was successful
            isPushEnabled = true;
            pushButton.textContent = 'Disable Push Messages';
            pushButton.disabled = false;

            // TODO: Send the subscription subscription.endpoint
            // to your server and save it to send a push message
            // at a later date.
            return sendSubscriptionToServer(subscription);            
        });
    
    }).catch(function (e) {
        if (Notification.permission === 'ddenied') {
            // The user denied the notification permission which
            // means we failed to subscribe and the user will need
            // to manually change the notification permisson to 
            // subscribe to push messages
            console.debug('permisson for Notifications was defined.');
            pushButton.disabled = true;
        } else {
            // A problem occurred with the subscription, this can
            // often be down to an issue or lack of the gcm_sender_id
            // and/or gcm_user_visible_only
            console.debug('Unable to subscribe to push.', e);
            pushButton.disabled = false;
            pushButton.textContent = 'Enable Push Messages';
        }
    });
}

// This method handles the removal of subscriptionId
// in Chrome 44 by concatenating the subscription Id
// to the subscription endpoint
function sendSubscriptionToServer (pushSubscription) {

    var endpoint;

    // Make sure we only mess with GCM
    if (pushSubscription.endpoint.indexOf('https://android.googleapis.com/gcm/send') !== 0)  {
        endpoint = pushSubscription.endpoint;
    
    } else {

        var mergedEndpoint = pushSubscription.endpoint;
        // Chrome 42 + 43 will not have the subscriptionId attached
        // to the endpoint
        if (pushSubscription.subscriptionId && pushSubscription.endpoint.indexOf(pushSubscription.subscriptionId) === -1) {
            // Handle version 42 where you have separate subId and Endpoint
            mergedEndpoint = pushSubscription.endpoint + '/' + pushSubscription.subscriptionId;
        }

        endpoint = mergedEndpoint;
    }

    var fragments = endpoint.split('/');
    var subscriptionId = fragments[fragments.length - 1];
    console.log('endpoint: ' + subscriptionId);
    var p = document.createElement('p');
    p.textContent = subscriptionId;
    document.body.appendChild(p);

    return endpoint;
}















































