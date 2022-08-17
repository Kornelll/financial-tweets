export class LoginModel {
	email: string;
	password: string;
	phone?: string = '923';
	name?: string;
	cnic?: string;
	overseas?: boolean;
	department?: {
		_id: string,
		name: string,
		role: {
			_id: string,
			name: string
		}
	};
}