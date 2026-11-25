import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar,
} from '@ionic/angular';
import { CrearUsuarioUseCase } from '../../../core/application/crear-usuario.use-case';
import { RecintosService } from '../../../core/application/recintos.service';
import { DatosPersona } from '../../../core/domain/models/nuevo-usuario.model';
import { AvisosService } from '../../shared/avisos.service';
import { FormularioUsuarioComponent } from '../../shared/formulario-usuario/formulario-usuario.component';

@Component({
  selector: 'app-nuevo-coordinador',
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, FormularioUsuarioComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar class="huellas">
        <ion-buttons slot="start"><ion-back-button defaultHref="/provincial"></ion-back-button></ion-buttons>
        <ion-title>Nuevo coordinador</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="contenedor">
        <p class="texto-secundario">
          Recinto: <strong>{{ recinto()?.nombre ?? '...' }}</strong>.
          Recibirá un correo con su usuario (la cédula) y la contraseña inicial.
        </p>
        @if (error()) { <p class="mensaje-error" role="alert">{{ error() }}</p> }
        <app-formulario-usuario
          textoBoton="Crear coordinador"
          [cargando]="cargando()"
          (guardar)="crear($event)">
        </app-formulario-usuario>
      </div>
    </ion-content>
  `,
})
export class NuevoCoordinadorPage implements OnInit {
  private readonly crearUsuario = inject(CrearUsuarioUseCase);
  private readonly recintos = inject(RecintosService);
  private readonly avisos = inject(AvisosService);
  private readonly router = inject(Router);
  private readonly recintoId = inject(ActivatedRoute).snapshot.paramMap.get('recintoId') ?? '';

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly recinto = computed(() => this.recintos.recintos().find((r) => r.id === this.recintoId));

  ngOnInit(): void {
    if (this.recintos.recintos().length === 0) {
      this.recintos.cargar();
    }
  }

  async crear(datos: DatosPersona): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const creado = await this.crearUsuario.ejecutar({
        ...datos,
        rol: 'coordinador_recinto',
        recintoId: this.recintoId,
      });
      if (creado.bienvenidaEnviada) {
        await this.avisos.exito('Coordinador creado. Le enviamos un correo de bienvenida.');
      } else {
        await this.avisos.advertencia('Coordinador creado, pero no se pudo enviar el correo de bienvenida.');
      }
      await this.router.navigateByUrl('/provincial', { replaceUrl: true });
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo crear el coordinador.');
    } finally {
      this.cargando.set(false);
    }
  }
}