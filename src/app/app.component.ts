import { Component, ViewChild } from '@angular/core'
import { FormGroup, FormControl, Validators } from '@angular/forms'
import { MatStep, MatStepper } from '@angular/material/stepper'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // Steppers
  @ViewChild('stepper') stepper: MatStepper
  @ViewChild('imageStep') imageStep: MatStep
  @ViewChild('resultStep') resultStep: MatStep

  // form groupo to valdiate presence of file
  imageFormGroup = new FormGroup({
    files: new FormControl('', Validators.required)
  })
  // List of file
  files: File[] = []

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
      this.imageFormGroup.setValue({
        files: true
      })
    } else {
      this.imageFormGroup.setValue({
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

  isFileImage = (file: File) => (file && file.type.split('/')[0] === 'image')

  submit() {

  }
}
