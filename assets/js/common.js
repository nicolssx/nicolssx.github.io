
if(navigator.serviceWorker){
  console.log('true');
  navigator.serviceWorker.register('sw.js').then(function(registration){
    console.log('Registered enevt at scope:',registration.scope);
  })
}