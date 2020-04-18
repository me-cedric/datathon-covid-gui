import { Component, ViewChild, OnInit } from '@angular/core'
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms'
import { MatStep, MatStepper } from '@angular/material/stepper'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  // File Types
  allowedFileTypes = 'image/*,application/x-zip-compressed,.nii,.nii.gz'

  // form groupo to valdiate presence of file
  imageFormGroup: FormGroup
  // List of file
  files: File[] = []
  // Are we waiting for the results
  loading = true
  // Available checks
  availableChecks: { label: string; value: string }[] = [
    { label: 'Classification', value: 'classification' },
    { label: 'Segmentation', value: 'segmentation' }
  ]

  // Steppers
  @ViewChild('stepper') stepper: MatStepper
  @ViewChild('imageStep') imageStep: MatStep
  @ViewChild('resultStep') resultStep: MatStep

  // Convenience getter for easy access to form fields
  get fields() {
    return this.imageFormGroup.controls
  }

  constructor(private formBuilder: FormBuilder) {}

  /**
   * Add a file
   * event: { addedFiles: any }
   */
  onSelect(event: { addedFiles: any }) {
    this.files.push(...event.addedFiles)
    this.validate()
  }

  /**
   * Remove a file
   * event: File
   */
  onRemove(event: File) {
    this.files.splice(this.files.indexOf(event), 1)
    this.validate()
  }

  /**
   * Validate presence of file
   */
  validate() {
    if (this.files.length > 0) {
      this.imageFormGroup.patchValue({
        files: true
      })
    } else {
      this.imageFormGroup.patchValue({
        files: null
      })
    }
  }

  /**
   * Reset the images
   */
  reset() {
    this.files = []
    this.stepper.reset()
  }

  isFileImage = (file: File) => file && file.type.split('/')[0] === 'image'

  submit() {
    // this.fields.checkRadio.value
    // this.files
  }

  ngOnInit() {
    this.imageFormGroup = this.formBuilder.group({
      files: ['', Validators.required]
    })
    this.imageFormGroup = this.formBuilder.group({
      checkRadio: ['classification', Validators.required]
    })
  }
}
