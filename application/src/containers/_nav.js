export default [
  {
    _name: "CSidebarNav",
    _children: [
      {
        _name: "CSidebarNavItem",
        name: "Dashboard",
        to: "/dashboard"
      },
      {
        _name: "CSidebarNavItem",
        name: "Tasks",
        to: "/dashboard/tasks",
      },
      {
        _name: "CSidebarNavItem",
        name: "TimeSeries",
        to: "/dashboard/timeseries",
      },
      {
        _name: "CSidebarNavItem",
        name: "Roles",
        to: "/dashboard/roles"
      },
      {
        _name: "CSidebarNavItem",
        name: "Users",
        to: "/dashboard/users"
      },
      {
        _name: "CSidebarNavItem",
        name: "Accounts",
        to: "/dashboard/accounts"
      }
    ]
  }
]