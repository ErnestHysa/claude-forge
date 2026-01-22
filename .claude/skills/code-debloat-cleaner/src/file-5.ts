    interface User {
      id: number;
      name: string;
      email: string;
    }
    
    async function fetchUser(id: number): Promise<User> {
      const response = await fetch(`/api/users/${id}`);
      return response.json();
    }
    
    console.log((await fetchUser(1)).name);
    