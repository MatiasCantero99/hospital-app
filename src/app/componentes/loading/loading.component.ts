import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../service/loading/loading.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule, NgIf],
  templateUrl: './loading.component.html', 
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent {
  constructor(public loadingService: LoadingService) {}

}
