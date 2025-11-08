exports.seed = async function(knex) {
  // Clear old data
  await knex("role_permissions").del();
  await knex("roles").del();
  await knex("permissions").del();

  // 1 Insert permissions
  const permissions = [
    "view_users", "create_users", "edit_users", "delete_users",
    "assign_role", "view_role", "edit_role", "delete_role",
    "view_permission", "assign_permission"
  ];

  const insertedPermissions = await knex("permissions")
    .insert(permissions.map(name => ({ name })))
    .returning(["id", "name"]);

  // Helper: get permission ids by name
  const getPerms = (...names) => {
    return insertedPermissions
      .filter(p => names.includes(p.name))
      .map(p => p.id);
  };

  // 2 Insert roles
  const roleData = [
    { name: "super_admin" },
    { name: "admin" },
    { name: "manager" },
    { name: "user" }
  ];

  const insertedRoles = await knex("roles").insert(roleData).returning(["id", "name"]);

  // Helper: get role id by name
  const getRoleId = name => insertedRoles.find(r => r.name === name).id;

  //  Assign permissions to roles via role_permissions table
  const rolePermissions = [
    ...getPerms(...permissions).map(pid => ({ role_id: getRoleId("super_admin"), permission_id: pid })),
    ...getPerms(...permissions).map(pid => ({ role_id: getRoleId("admin"), permission_id: pid })),
    ...getPerms(
      "view_users", "create_users", "edit_users", "delete_users", "view_role", "view_permission"
    ).map(pid => ({ role_id: getRoleId("manager"), permission_id: pid })),
    ...getPerms("view_users", "view_role").map(pid => ({ role_id: getRoleId("user"), permission_id: pid }))
  ];

  await knex("role_permissions").insert(rolePermissions);

  console.log(" Roles and Permissions seeded successfully!");
};
