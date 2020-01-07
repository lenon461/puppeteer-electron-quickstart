import fs from 'fs';
export class Logger {
    constructor(env) {
        if (process.versions.electron) { 
            this._htmlLogger = document.getElementById('logger');
        }
        this.env = env || "dev"
        this._logs = [];
    }

    logInfo(msg) {
        this.log(msg);
    }

    logAlways(msg) {
        let temp = this.env;
        this.env = 'dev'
        this.log(msg);
        this.env = temp;
    }

    logError(msg) {
        this.log(msg, 'color: red;')
    }

    log(msg, style) {
        if (!msg) return;
        
        if (this._htmlLogger && this.env == "dev") {
            this._htmlLogger
            .insertAdjacentHTML('beforeend', `\n <p style="${style || 'color: black;'}">${msg}</p>`);
            // Scroll to bottom
            this._htmlLogger.scrollTop = this._htmlLogger.scrollHeight;
        }else {
            console.log(msg);
        }

        this._logs.push(msg);
    }

    exportLogs(path) {
        return new Promise((resolve, reject) => {
            fs.writeFile(path, this._logs.join('\n'), (err) => {
                resolve();
            });
        });
    }

    clean() {
        this._htmlLogger.innerText = '새로 결제할 리스트입니다.'
    }
}