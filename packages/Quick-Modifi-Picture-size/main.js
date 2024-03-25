'use strict';
const { dialog } = require('electron');

module.exports = {
  load() {
    // execute when package loaded
    Editor.log('Hello World!!!!!!!!  load');

  },

  unload() {
    // execute when package unloaded
  },

  // register your ipc messages here
  messages: {
    'open'() {
      // open entry panel registered in package.json
      Editor.Panel.open('Quick-Modifi-Picture-size');
    },
    'say-hello'() {
      Editor.log('Hello World!!!!!!!!');
      // send ipc message to panel
      Editor.Ipc.sendToPanel('Quick-Modifi-Picture-size', 'Quick-Modifi-Picture-size:hello');
    },
    'clicked'() {
      Editor.log('Button clicked!');
    },

    // 在插件脚本中执行文件选择操作
    'selectFile'() {
      const fileFilters = [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] },
        { name: 'All Files', extensions: ['*'] },
      ];

      const options = {
        title: 'Select a file',
        properties: ['openFile'],
        filters: fileFilters,
      };

      dialog.showOpenDialog(options).then((result) => {
        if (!result.canceled) {
          const filePath = result.filePaths[0];
          // 在这里可以处理所选文件的路径
          console.log('Selected file path:', filePath);
        }
      }).catch((error) => {
        console.error('Error opening file dialog:', error);
      });
    }

  },
};