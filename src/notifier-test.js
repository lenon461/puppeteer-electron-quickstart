const notifier = require('node-notifier');

// Object
notifier.notify({
  title: 'Alarm Clock',
  message: '알람이 활성화 되었습니다!',
  icon: path.join(__dirname, 'clock.ico'),
  sound: true,
  wait: true,
});