import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { GpsPort } from '../../domain/ports/gps.port';
import { Ubicacion } from '../../domain/models/registro-acta.model';

/** GPS con alta precisión y 10 segundos de límite (ADR-003). */
@Injectable()
export class CapacitorGpsAdapter implements GpsPort {
    async obtenerUbicacion(): Promise<Ubicacion> {
        if (Capacitor.isNativePlatform()) {
            const permisos = await Geolocation.checkPermissions();
            if (permisos.location !== 'granted') {
                const respuesta = await Geolocation.requestPermissions({ permissions: ['location'] });
                if (respuesta.location !== 'granted') {
                    throw new Error('Necesitamos tu ubicación para registrar el acta. Activa el permiso en la configuración del celular.');
                }
            }
        }
        try {
            let posicion;
            try {
                // 1.º intento: alta precisión, 10 segundos (ADR-003)
                posicion = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                });
            } catch (primerError) {
                const codigo = (primerError as { code?: number }).code;
                if (codigo === 1) {
                    throw primerError; // permiso denegado: no tiene sentido reintentar
                }
                // 2.º intento: precisión normal (Wi-Fi o red), 20 segundos
                posicion = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: false,
                    timeout: 20000,
                    maximumAge: 60000,
                });
            }
            return {
                latitud: posicion.coords.latitude,
                longitud: posicion.coords.longitude,
                precision: posicion.coords.accuracy,
                capturadaAt: new Date(posicion.timestamp).toISOString(),
            };
        } catch (e) {
            const error = e as { code?: number; message?: string };
            const mensaje = (error.message ?? '').toLowerCase();
            if (error.code === 1 || mensaje.includes('denied') || mensaje.includes('permission')) {
                throw new Error('No diste permiso de ubicación. Actívalo y vuelve a intentarlo.');
            }
            if (error.code === 3 || mensaje.includes('timeout')) {
                throw new Error('El GPS tardó demasiado. Acércate a una ventana o sal a un lugar abierto.');
            }
            throw new Error('No se pudo obtener la ubicación. Revisa que el GPS (o la ubicación de Windows) esté encendido.');
        }
    }
}