import { Timestamp } from 'firebase/firestore';

export interface Comment {
  id: string;
  clientId: string;
  text: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NewComment {
  text: string;
}

export const initialCommentState: NewComment = {
  text: '',
};
