export default [
  {
    _name: 'CSidebarNav',
    _children: [
      {
        _name: 'CSidebarNavItem',
        name: 'Dashboard',
        to: '/dashboard'
      },
      {
        _name: 'CSidebarNavItem',
        name: 'Roles',
        to: '/dashboard/roles',
        icon: 'cil-people'
      },
      {
        _name: 'CSidebarNavItem',
        name: 'Users',
        to: '/dashboard/users',
        icon: 'cil-people'
      },
      {
        _name: 'CSidebarNavItem',
        name: 'Accounts',
        to: '/dashboard/accounts',
        icon: 'cil-people'
      }
    ]
  }
]