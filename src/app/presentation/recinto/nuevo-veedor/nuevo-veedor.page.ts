import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar,
} from '@ionic/angular';
import { CrearUsuarioUseCase } from '../../../core/application/crear-usuario.use-case';
import { DatosPersona } from '../../../core/domain/models/nuevo-usuario.model';
import { AvisosService } from '../../shared/avisos.service';
import { FormularioUsuarioComponent } from '../../shared/formulario-usuario/formulario-usuario.component';

@Component({
  selector: 'app-nuevo-veedor',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, FormularioUsuarioComponent],
  template: `
    <ion-header>
      <ion-toolbar class="huellas">
        <ion-buttons slot="start"><ion-back-button defaultHref="/recinto/veedores"></ion-back-button></ion-buttons>
        <ion-title>Nuevo veedor</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="contenedor">
        <p class="texto-secundario">
          El veedor quedará en tu recinto y recibirá un correo con su usuario y la contraseña inicial.
        </p>
        @if (error()) { <p class="mensaje-error" role="alert">{{ error() }}</p> }
        <app-formulario-usuario textoBoton="Crear veedor" [cargando]="cargando()" (guardar)="crear($event)">
        </app-formulario-usuario>
      </div>
    </ion-content>
  `,
})
export class NuevoVeedorPage {
  private readonly crearUsuario = inject(CrearUsuarioUseCase);
  private readonly avisos = inject(AvisosService);
  private readonly router = inject(Router);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  async crear(datos: DatosPersona): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      // el recinto lo pone el servidor: siempre el del coordinador (ADR-002)
      const creado = await this.crearUsuario.ejecutar({ ...datos, rol: 'veedor', recintoId: null });
      if (creado.bienvenidaEnviada) {
        await this.avisos.exito('Veedor creado. Le enviamos un correo de bienvenida.');
      } else {
        await this.avisos.advertencia('Veedor creado, pero no se pudo enviar el correo de bienvenida.');
      }
      await this.router.navigateByUrl('/recinto/veedores', { replaceUrl: true });
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo crear el veedor.');
    } finally {
      this.cargando.set(false);
    }
  }
}