import Accounts from "../components/dashboard/Accounts";
import Users from "../components/dashboard/Users";
import Roles from "../components/dashboard/Roles";

export default [
    {
        path: 'roles',
        name: 'Roles',
        component: Roles,
        meta: {
            requiredAuth: true,
            access: ['manager', 'user', 'admin', 'superadmin']
        }
    },
    {
        path: 'users',
        name: 'Users',
        component: Users,
        meta: {
            requiredAuth: true,
            access: ['manager', 'user', 'admin', 'superadmin']
        }
    },
    {
        path: 'accounts',
        name: 'Accounts',
        component: Accounts,
        meta: {
            requiredAuth: true,
            access: ['manager', 'user', 'admin', 'superadmin']
        }
    }
]
