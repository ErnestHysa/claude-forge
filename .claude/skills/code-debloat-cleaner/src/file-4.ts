    // Type definitions
    interface User {
      id: number;
      name: string;
      email: string;
    }
    
    interface UnusedType {
      value: string;
    }
    
    // Unused type
    type Status = 'active' | 'inactive';
    
    /**
     * Fetch user data
     */
    async function fetchUser(id: number): Promise<User> {
      const response = await fetch(`/api/users/${id}`);
      return response.json();
    }
    
    // Duplicate implementation
    async function getUser(id: number): Promise<User> {
      const response = await fetch(`/api/users/${id}`);
      return response.json();
    }
    
    // Unused function
    function logUser(user: User): void {
      console.log(user);
    }
    
    const user = await fetchUser(1);
    console.log(user.name);
    