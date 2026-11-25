import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonSpinner,
  IonTitle, IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { camera, checkmarkCircle, image, warning } from 'ionicons/icons';
import { CapturaService } from '../../../core/application/captura.service';
import { CorregirActaUseCase } from '../../../core/application/corregir-acta.use-case';
import { Dignidad, TotalesActa } from '../../../core/domain/models/acta.model';
import { ActaGuardada } from '../../../core/domain/models/correccion.model';
import { FotoAnalizada } from '../../../core/domain/models/registro-acta.model';
import { CorreccionPort } from '../../../core/domain/ports/correccion.port';
import { ResultadoTotales, validarTotalesActa } from '../../../core/domain/rules/acta.rule';
import { UMBRAL_NITIDEZ } from '../../../core/domain/rules/nitidez.rule';
import { AvisosService } from '../avisos.service';

const ENTERO = [Validators.required, Validators.pattern(/^\d+$/)];
const TECLAS_BLOQUEADAS = ['-', '+', 'e', 'E', '.', ','];

/**
 * Corrección de un acta registrada. La usan el veedor y el coordinador.
 * La ruta dice si se puede cambiar la foto (solo coordinador) y a dónde volver.
 */
@Component({
  selector: 'app-corregir-acta',
  templateUrl: './corregir-acta.page.html',
  styleUrls: ['./corregir-acta.page.scss'],
  imports: [
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonContent,
    IonInput, IonIcon, IonSpinner,
  ],
})
export class CorregirActaPage implements OnInit {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly correccion = inject(CorreccionPort);
  private readonly corregirActa = inject(CorregirActaUseCase);
  private readonly captura = inject(CapturaService);
  private readonly avisos = inject(AvisosService);

  readonly juntaId = this.ruta.snapshot.paramMap.get('juntaId') ?? '';
  readonly dignidad = (this.ruta.snapshot.paramMap.get('dignidad') ?? 'alcalde') as Dignidad;
  readonly textoDignidad = this.dignidad === 'alcalde' ? 'Alcaldía' : 'Prefectura';
  readonly puedeCambiarFoto = this.ruta.snapshot.data['puedeCambiarFoto'] === true;
  readonly volver: string = this.ruta.snapshot.data['volver'] ?? '/';
  readonly umbral = UMBRAL_NITIDEZ;

  readonly acta = signal<ActaGuardada | null>(null);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly suma = signal<ResultadoTotales | null>(null);
  readonly fotoNueva = signal<FotoAnalizada | null>(null);
  readonly hayCambios = signal(false);

  readonly fotoNuevaNitida = computed(() => {
    const f = this.fotoNueva();
    return f !== null && f.nitidez >= this.umbral;
  });

  readonly form = new FormGroup<Record<string, FormControl<string>>>({
    nulos: new FormControl('', { nonNullable: true, validators: ENTERO }),
    blancos: new FormControl('', { nonNullable: true, validators: ENTERO }),
    total: new FormControl('', { nonNullable: true, validators: ENTERO }),
  });

  constructor() {
    addIcons({ camera, checkmarkCircle, image, warning });
  }

  async ngOnInit(): Promise<void> {
    await this.cargar();
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.hayCambios.set(true);
      this.suma.set(validarTotalesActa(this.totales()));
    });
  }

  /** Trae el acta actual y llena el formulario con sus valores. */
  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const acta = await this.correccion.actaDe(this.juntaId, this.dignidad);
      if (!acta) {
        this.error.set('Esta mesa todavía no tiene registrada el acta de ' + this.textoDignidad.toLowerCase() + '.');
        return;
      }
      acta.votos.forEach((v) => {
        const control = this.form.controls[v.organizacionId];
        if (control) {
          control.setValue(String(v.votos), { emitEvent: false });
        } else {
          this.form.addControl(
            v.organizacionId,
            new FormControl(String(v.votos), { nonNullable: true, validators: ENTERO }),
            { emitEvent: false },
          );
        }
      });
      this.form.patchValue(
        { nulos: String(acta.nulos), blancos: String(acta.blancos), total: String(acta.totalSufragantes) },
        { emitEvent: false },
      );
      this.acta.set(acta);
      this.fotoNueva.set(null);
      this.hayCambios.set(false);
      this.suma.set(validarTotalesActa(this.totales()));
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el acta.');
    } finally {
      this.cargando.set(false);
    }
  }

  soloDigitos(evento: KeyboardEvent): void {
    if (TECLAS_BLOQUEADAS.includes(evento.key)) {
      evento.preventDefault();
    }
  }

  private totales(): TotalesActa {
    const v = this.form.getRawValue();
    return {
      votos: (this.acta()?.votos ?? []).map((o) => ({ organizacionId: o.organizacionId, votos: Number(v[o.organizacionId]) })),
      nulos: Number(v['nulos']),
      blancos: Number(v['blancos']),
      totalSufragantes: Number(v['total']),
    };
  }

  async verFotoActual(): Promise<void> {
    const ruta = this.acta()?.fotoRuta;
    if (!ruta) {
      return;
    }
    try {
      window.open(await this.correccion.urlFoto(ruta), '_blank');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo abrir la foto.');
    }
  }

  async tomarFotoNueva(): Promise<void> {
    try {
      const foto = await this.captura.tomarFoto();
      if (foto) {
        this.fotoNueva.set(foto);
        this.hayCambios.set(true);
      }
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo tomar la foto.');
    }
  }

  async guardar(): Promise<void> {
    const acta = this.acta();
    if (!acta) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Completa todos los valores con números enteros.');
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    try {
      const foto = this.fotoNueva();
      const version = await this.corregirActa.ejecutar({
        acta,
        totales: this.totales(),
        fotoDataUrl: foto?.dataUrl ?? null,
        nitidez: foto?.nitidez ?? null,
      });
      await this.avisos.exito(`Acta de la mesa ${acta.mesa} corregida (versión ${version}).`);
      await this.router.navigateByUrl(this.volver, { replaceUrl: true });
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo corregir el acta.');
    } finally {
      this.guardando.set(false);
    }
  }
}
