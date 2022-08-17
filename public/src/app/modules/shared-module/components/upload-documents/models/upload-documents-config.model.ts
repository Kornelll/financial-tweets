export class UploadDocumentConfigModel {
	model: string = '';
    key: string = '';
    uploadOnSelect? = false;
    fetch? = false;
    fixedText?: number;

    showLabels?: boolean = true;
    
    filesLimit?;
    queueLimit?: number;

    allowedFileType?;

    maxFileSize?: number;//in MBs

}