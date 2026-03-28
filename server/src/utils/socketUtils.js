/**
 * socketUtils.js
 * Stores and exposes the Socket.io instance so controllers can emit events
 * without creating a second io instance.
 */
let _io = null;

export const setIO = (io) => {
    _io = io;
};

export const getIO = () => {
    if (!_io) throw new Error("Socket.io not initialised — call setIO(io) from server.js first.");
    return _io;
};
