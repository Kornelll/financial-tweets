import { Directive, Input, TemplateRef, ViewContainerRef, OnDestroy } from '@angular/core';
import { AclService } from '@/services';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Add the template content to the DOM unless the condition is true.
 */
@Directive({ selector: '[ifRole]' })
export class RoleDirective implements OnDestroy {
  public hasView = false;
  logic = 'and';
  constructor(
    public templateRef: TemplateRef<any>,
    public viewContainer: ViewContainerRef,
    public aclService: AclService,
  ) {
    this.aclService.getAclChangedSubject().pipe(takeUntil(this.$destroy)).subscribe(res => {
      console.log("notified");
      this.validateIfUI(this.obj);
    })
  }

  obj: AclInterface;
  $destroy = new Subject();
  ngOnDestroy() {
    this.$destroy.next();
  }


  ///////////////////////////////////////////////////////////////////////////
  @Input() set ifRole(obj: AclInterface) {
    this.obj = obj;
    this.validateIfUI(obj);
  }

  validateIfUI(obj) {
    let condition = !obj || this.aclService.allowObj(obj);
    if (condition && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!condition && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  @Input() set ifRoleElse(elseRef) {
    if (!this.hasView && elseRef) {
      this.viewContainer.createEmbeddedView(elseRef);
      this.hasView = true;
    }
  }
}

export interface AclInterface {
  app?: {
    codes: string[],
    logic?: 'and' | 'or'
  }
}