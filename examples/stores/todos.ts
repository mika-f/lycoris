import { atom } from "../lycoris";

type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

const todos = atom<Todo[]>({ default: [] });

export default todos;
