import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FileUploader, FileUploaderOptions } from 'ng2-file-upload';
import { MatDialog } from '@angular/material';
import { ToastrService } from 'ngx-toastr';
import { DocumentService } from './services/document.service';
import { DocumentModel, UploadDocumentConfigModel } from './models';
import { CommonScripts, CacheHandler } from '@/scripts';
import { AppSettings } from '@/settings';
import { DashboardService } from '@/services';

@Component({
	selector: 'upload-documents',
	templateUrl: 'upload-documents.component.html',
	styleUrls: ['./upload-documents.component.css', './spinner-overlay.css']
})

export class UploadDocumentsComponent implements OnInit {
	_attached: Array<DocumentModel>;
	@Input('attached') set attached(attached) {
		this.handleAttached(attached);
	}
	get attached() {
		return this._attached;
	}
	handleAttached(attached) {
		if (this.config && this.config.fixedText) {
			attached = attached.map(d => {
				d.fixedname = `${d.originalname.substr(0, this.config.fixedText)} ...`;
				return d;
			})
		}
		this._attached = attached;
		this.filteredDocuments = attached;
		this.documents = attached;
	}

	progress = 0;

	@Input() viewMode = false;
	_config: UploadDocumentConfigModel;
	@Input() set config(config: UploadDocumentConfigModel) {
		this._config = config;
		if (config) {
			if (config.uploadOnSelect) {
				this.registerAutoUpload();
			}

			if (config.fetch && config.key && config.model) {
				this.documentService.getAllRecordsByQuery(`?model=${config.model}&key=${config.key}&ids=all`).subscribe(res => {
					try { this.handleAttached(res[0].documents); } catch (err) { }
				})
			}

			if (config.allowedFileType) {
				this.uploader.setOptions({ allowedFileType: config.allowedFileType });
			}

			if (config.queueLimit) {
				this.uploader.setOptions({ queueLimit: config.queueLimit });
			}
			if (config.maxFileSize) {
				this.uploader.setOptions({ maxFileSize: config.maxFileSize * 1024 * 1024 });
			}
		}
	}
	get config(): UploadDocumentConfigModel {
		return this._config;
	}

	@Output() upload = new EventEmitter();
	@Output() uploadError = new EventEmitter();
	errorQueue = [];

	filteredDocuments: any = [];
	documents: any = [];
	searchQuery;

	public fileUploaderOptions: FileUploaderOptions = {
		allowedFileType: ['image', 'video', 'audio', 'pdf', 'doc', 'xls', 'ppt'],
		maxFileSize: 25 * 1024 * 1024, // in MB
		queueLimit: 10
	};

	public uploader: FileUploader = new FileUploader({
		headers: [{ name: 'apikey', value: CacheHandler.getStoredToken() }]
	});
	constructor(
		public dialog: MatDialog,
		public toastr: ToastrService,
		public documentService: DocumentService,
		private dashboarSvc: DashboardService
	) {

		// set allowed filesize and filetypes
		this.uploader.setOptions(this.fileUploaderOptions);
		this.uploader.onWhenAddingFileFailed = (item: any, filter: any, options: any) => {
			this.progress = 0;
			this.toastr.clear();
			this.toastr.error(CommonScripts.getFileUploadError(item, filter, this.uploader), 'Validation failed!');
		}



		this.uploader.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
			if (status == 200) {
				this.documentService.response.push((typeof response == 'string' ? JSON.parse(response) : response));
				if (this.documentService.response.length == this.uploader.queue.length) {
					try { this.handleAttached((JSON.parse(response)).documents); } catch (err) { }
					this.upload.emit(this.documentService.response);
					this.documentService.globalDocumentUploadedEmitter.emit(this.documentService.response);
					this.errorMsg = null;
					this.submitted = false;
					this.progress = 0;
					this.uploader.clearQueue();
					// this.toastr.success('Document(s) uploaded successfully', 'Upload Success');
				}
			} else {
				this.errorQueue.push(JSON.parse(response));
				if (this.errorQueue.length == this.uploader.queue.length) {
					this.uploadError.emit(this.errorQueue);
					this.errorQueue = [];
				}
			}
		}
		this.uploader.onErrorItem = (item, response, status) => {
			// this.errorMsg = response;
			this.errorMsg = response || "API Route not defined for upload"
			this.submitted = false;
			this.progress = 0;
			this.uploader.clearQueue();
		}

		this.uploader.onProgressItem = (progress: any) => {
			this.progress = progress['progress']
		};
	}

	registerAutoUpload() {
		if (this.config && this.config.uploadOnSelect) {
			this.uploader.onAfterAddingAll = (itemFile) => {
				if (this.config.key) {
					this.documentService.response = [];
					this.uploader.setOptions({ url: `${AppSettings.API_ENDPOINT}/documents/upload/${this.config.model}/${this.config.key}` });
					this.errorMsg = null;
					this.submitted = true;
					this.progress = 0;
					this.errorQueue = [];
					this.uploader.uploadAll();
				} else {
					this.toastr.info(`MODEL OR KEY (ID) is not defined to upload documents -- model: ${this.config.model}, key: ${this.config.key}`, "Cannot auto upload document! Please specify MODEL & KEY as component input when config Flag is set");
				}
			}
		}
	}

	ngOnInit() {
	}
	removeFile(i) {
		this.uploader.queue.splice(i, 1);
	}
	errorMsg;
	submitted = false;
	docsLength = 0;
	uploadFiles(options: { model?: string, key?: string, url?: string }) {
		if (options.model && options.key) {
			this.config.model = options.model;
			this.config.key = options.key;
			this.uploader.setOptions({ url: `${AppSettings.API_ENDPOINT}/documents/upload/${options.model}/${options.key}` });
		} else if (options.url) {
			this.uploader.setOptions({ url: options.url });
		} else {
			this.toastr.warning(`Neither url nor model,key defined`, `Ask Developer!`);
			return;
		}
		if (this.uploader.queue.length) {
			this.errorMsg = "";
			this.docsLength = this.uploader.queue.length;
			this.submitted = true;
			this.errorMsg = "";
			this.documentService.response = [];
			this.progress = 0;
			this.errorQueue = [];
			this.uploader.uploadAll();
		} else {
			this.upload.emit([]);
		}
	}
	deleteDoc(doc, i) {

		this.dashboarSvc.showConfirmDialog(`Are you sure you want to delete this document`, `You cannot undo this operation as the uploaded file will be permanently deleted`, (res) => {
			if (res) {
				this.documentService.delete(doc._id).subscribe(result => {

					this.dashboarSvc.showInfoDialog(`The document has been deleted successfully`, ``, `success`, () => {

						this.attached.splice(i, 1);
					});
					// this.toastr.success("Document is deleted.", "Success");
				});
			}
		})

		// this.documentService.delete(doc._id).subscribe(result => {
		// 	this.attached.splice(i, 1);
		// 	this.toastr.success("Document is deleted.", "Success");
		// });

	}
	public hasBaseDropZoneOver: boolean = false;

	public fileOverBase(e: any): void {
		this.hasBaseDropZoneOver = e;
	}
	downloadFile(doc) {

		this.dashboarSvc.showConfirmDialog(`Are you sure you want to download this document?`, `<strong>${doc.originalname}</strong> - ${(doc.size / (1024 * 1024)).toFixed(2)} MB`, (res) => {
			if (res) {

				window.open(`${AppSettings.API_ENDPOINT}/documents/download/${doc._id}?apikey=${CacheHandler.getStoredToken()}`);
			}
		})

		// Cookie.set('apikey', localStorage.getItem('_t'));

		// let dialog = this.dialog.open(ConfirmDialogComponent);
		// dialog.componentInstance.dialogMessage = "Download " + " ?";
		// dialog.componentInstance.dialogNote = doc.originalname;
		// dialog.afterClosed().subscribe(res => {
		// 	if (res) {
		// 		Cookie.set('accessToken', localStorage.getItem('auth_token'));
		// 		window.open(`${AppSettings.API_ENDPOINT}/documents/download/${doc._id}`);
		// 	}
		// })

	}

	onSearchInput() {
		if (this.searchQuery) {
			this.filteredDocuments = this._attached.filter(doc => doc.originalname.toLowerCase().indexOf(this.searchQuery.toLowerCase()) > -1);
		} else {
			this.filteredDocuments = this._attached;
		}
	}
}



// ##################################################################### //
// ####### The allowedFileTypes are actually not file extensions. ###### //
// List of allowedFileTypes values:

// application
// image
// video
// audio
// pdf
// compress
// doc
// xls
// ppt
// ##################################################################### //