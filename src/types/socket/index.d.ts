export type AuthenticatedUser = {
  _id: string;
};

// Attached by the io.use handshake middleware. Non-optional: the middleware
// rejects the connection outright, so any socket that reaches a handler has it.
export type SocketData = {
  user: AuthenticatedUser;
};

export type ChatMessage = {
  id: string;
  fromUserId: string;
  firstName: string;
  text: string;
  createdAt: string;
};
