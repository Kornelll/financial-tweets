export class ProjectRoleModel {
    _id?: string;
    model: {
        _id: string,
        name: string,
        typeOfModel: string
    }
    role: RoleModel;//for POST case
    roles?: RoleModel[];
    createdAt?: Date;
    updatedAt?: Date;
}
export class RoleModel {
    _id?: string;
    name: string;
    description?: string;
    permissions?: PermissionModel[];
    constant? = false;
}
export class PermissionModel {
    _id?: string
    name: string
    code: string
    module: string
}