import { PermissionModel } from '../../configurations-module/models';

export class UserModel {
  _id: string;
  name: string;
  phone: string = '923';
  email: string;
  isActive: boolean;
  password: string;
  avatar?: string;
  avatarSrc?: string;
  college: { _id: string, name: string };
  fatherName?: string;
  dateOfBirth?: Date;
  gender?: string;
  approvedAt?: Date;
  cnic?: string;
  approvedBy?: {
    _id: string,
    name: 'String'

  };
  resetToken?: string;
  role: {
    _id?: string,
    name: string,
    permissions?: PermissionModel[]
  };
  accountStatus?: string;
  department: {
    _id: string,
    name: string,
    role: {
      _id?: string,
      name: string,
      permissions?: PermissionModel[]
    }
  }

  skillCategories: any[];
  address: string;

  configurations: UserConfigurationModel

  constructor() {
    this.role = {
      _id: '',
      name: ''
    };
    this.initDepartment();
  }
  initDepartment() {
    this.department = {
      _id: '',
      name: '',
      role: {
        _id: '',
        name: ''
      }
    }
  }
}

export class UserConfigurationModel {
  notifications: {
    viaSms: boolean,
    viaEmail: boolean,
    viaPushNotifications: boolean
  }
}