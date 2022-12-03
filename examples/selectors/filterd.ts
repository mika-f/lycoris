import { selector } from "../lycoris";

import filterAtom from "../stores/filter";
import todosAtom from "../stores/todos";

const filtered = selector({
  get: ({ get }) => {
    const filter = get(filterAtom);
    const todos = get(todosAtom);

    if (filter === "all") {
      return todos;
    } else if (filter === "completed") {
      return todos.filter((w) => w.completed);
    }

    return todos.filter((w) => !w.completed);
  },
});

export default filtered;
