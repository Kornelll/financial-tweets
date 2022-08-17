import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { Encrytojs } from '@/scripts';
import { AppSettings } from '@/settings';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService extends Socket {

  constructor(
    private socket: Socket
  ) {
    super({ url: AppSettings.SOCKET_IO_URL, options: {} });
  }


  sendMessage(data) {
    // this.socket.emit('message', data);
  }

  newMessageReceived() {
    const observable = new Observable<{ data: any, type: 'sys-acl' | 'dpt-acl' | 'download-path' }>(observer => {
      this.socket.on('new message', (data) => {
        if (data && data.__encrypted) {
          data = JSON.parse(Encrytojs.decrypt(data.data, `crypto-key-socket-io`));
        }
        observer.next(data);
      });
    });
    return observable;
  }


}