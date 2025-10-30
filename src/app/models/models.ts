export interface User {
  id: number;
  name: string;
  email: string;
  gender: 'male' | 'female';
  status: 'active' | 'inactive';
}

export interface Post {
  id: number;
  post_id?: number;
  title: string;
  body: string;
  likes?: number;
  image_url?: string;
  comments?: PostComment[];
}

export interface PostComment {
  id: number;
  post_id: number;
  parent_id?: number;
  name?: string;
  email?: string;
  body?: string;
  likes?: number;
}

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  due_on: string;
  status: 'pending' | 'completed';
}
