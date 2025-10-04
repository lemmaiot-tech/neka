
import { EventEmitter } from 'events';

// A simple event emitter to broadcast errors from anywhere in the app.
export const errorEmitter = new EventEmitter();
