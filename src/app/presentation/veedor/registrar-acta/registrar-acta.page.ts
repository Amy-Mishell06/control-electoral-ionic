import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonSpinner,
  IonTitle, IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { camera, checkmarkCircle, location, warning } from 'ionicons/icons';
import { CapturaService } from '../../../core/application/captura.service';
import { MesasService } from '../../../core/application/mesas.service';
import { RegistrarActaUseCase } from '../../../core/application/registrar-acta.use-case';
import { Dignidad, TotalesActa } from '../../../core/domain/models/acta.model';
import {
  FotoAnalizada, OrganizacionCandidato, Ubicacion,
} from '../../../core/domain/models/registro-acta.model';
import { ResultadoTotales, validarTotalesActa } from '../../../core/domain/rules/acta.rule';
import { UMBRAL_NITIDEZ } from '../../../core/domain/rules/nitidez.rule';
import { AvisosService } from '../../shared/avisos.service';

type Paso = 'votos' | 'foto' | 'ubicacion' | 'resumen';
const PASOS: Paso[] = ['votos', 'foto', 'ubicacion', 'resumen'];
const ENTERO = [Validators.required, Validators.pattern(/^\d+$/)];
/** Teclas que permitirían negativos o decimales en un input numérico. */
const TECLAS_BLOQUEADAS = ['-', '+', 'e', 'E', '.', ','];

@Component({
  selector: 'app-registrar-acta',
  templateUrl: './registrar-acta.page.html',
  styleUrls: ['./registrar-acta.page.scss'],
  imports: [
    ReactiveFormsModule, DatePipe, DecimalPipe,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonContent,
    IonInput, IonIcon, IonSpinner,
  ],
})
export class RegistrarActaPage implements OnInit {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mesas = inject(MesasService);
  private readonly captura = inject(CapturaService);
  private readonly registrarActa = inject(RegistrarActaUseCase);
  private readonly avisos = inject(AvisosService);

  readonly juntaId = this.ruta.snapshot.paramMap.get('juntaId') ?? '';
  readonly dignidad = (this.ruta.snapshot.paramMap.get('dignidad') ?? 'alcalde') as Dignidad;
  readonly textoDignidad = this.dignidad === 'alcalde' ? 'Alcaldía' : 'Prefectura';
  readonly umbral = UMBRAL_NITIDEZ;
  private readonly uuidCliente = crypto.randomUUID(); // evita duplicados si se reintenta (ADR-014)

  readonly mesa = computed(() => this.mesas.mesas().find((m) => m.juntaId === this.juntaId));
  readonly organizaciones = signal<OrganizacionCandidato[]>([]);
  readonly paso = signal<Paso>('votos');
  readonly indicePaso = computed(() => PASOS.indexOf(this.paso()));
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly suma = signal<ResultadoTotales | null>(null);
  readonly foto = signal<FotoAnalizada | null>(null);
  readonly ubicacion = signal<Ubicacion | null>(null);

  readonly form = new FormGroup<Record<string, FormControl<string>>>({
    nulos: new FormControl('', { nonNullable: true, validators: ENTERO }),
    blancos: new FormControl('', { nonNullable: true, validators: ENTERO }),
    total: new FormControl('', { nonNullable: true, validators: ENTERO }),
  });

  constructor() {
    addIcons({ camera, checkmarkCircle, location, warning });
  }

  async ngOnInit(): Promise<void> {
    await this.ejecutar(async () => {
      if (this.mesas.mesas().length === 0) {
        await this.mesas.cargar();
      }
      const organizaciones = await this.registrarActa.organizaciones(this.dignidad);
      organizaciones.forEach((o) =>
        this.form.addControl(o.organizacionId, new FormControl('', { nonNullable: true, validators: ENTERO })),
      );
      this.organizaciones.set(organizaciones);
      this.form.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.actualizarSuma());
    });
  }

  /** Impide escribir negativos o decimales en los votos (ADR-006). */
  soloDigitos(evento: KeyboardEvent): void {
    if (TECLAS_BLOQUEADAS.includes(evento.key)) {
      evento.preventDefault();
    }
  }

  /** La suma se recalcula mientras el veedor escribe (ADR-005, ADR-006). */
  private actualizarSuma(): void {
    this.suma.set(this.form.controls['total'].value === '' ? null : validarTotalesActa(this.totales()));
  }

  private totales(): TotalesActa {
    const v = this.form.getRawValue();
    return {
      votos: this.organizaciones().map((o) => ({ organizacionId: o.organizacionId, votos: Number(v[o.organizacionId]) })),
      nulos: Number(v['nulos']),
      blancos: Number(v['blancos']),
      totalSufragantes: Number(v['total']),
    };
  }

  continuarVotos(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Completa todos los valores con números enteros.');
      return;
    }
    const resultado = validarTotalesActa(this.totales());
    if (!resultado.cuadra) {
      this.error.set(resultado.errores.join(' '));
      return;
    }
    this.error.set(null);
    this.paso.set('foto');
  }

  async tomarFoto(): Promise<void> {
    await this.ejecutar(async () => {
      const foto = await this.captura.tomarFoto();
      if (foto) {
        this.foto.set(foto);
      }
    });
  }

  async obtenerUbicacion(): Promise<void> {
    await this.ejecutar(async () => {
      this.ubicacion.set(await this.captura.obtenerUbicacion());
    });
  }

  irA(paso: Paso): void {
    this.error.set(null);
    this.paso.set(paso);
  }

  async enviar(): Promise<void> {
    const mesa = this.mesa();
    if (!mesa) {
      this.error.set('No se encontró la mesa.');
      return;
    }
    await this.ejecutar(async () => {
      await this.registrarActa.ejecutar({
        juntaId: this.juntaId,
        recintoId: mesa.recintoId,
        dignidad: this.dignidad,
        totales: this.totales(),
        fotoDataUrl: this.foto()?.dataUrl ?? null,
        nitidez: this.foto()?.nitidez ?? null,
        ubicacion: this.ubicacion(),
        uuidCliente: this.uuidCliente,
      });
      await this.avisos.exito(`Acta de ${this.textoDignidad.toLowerCase()} de la mesa ${mesa.numero} registrada.`);
      await this.router.navigateByUrl('/veedor', { replaceUrl: true });
    });
  }

  private async ejecutar(accion: () => Promise<void>): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      await accion();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Ocurrió un error. Inténtalo de nuevo.');
    } finally {
      this.cargando.set(false);
    }
  }
}
