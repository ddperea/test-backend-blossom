import cron, { ScheduledTask } from 'node-cron';
import rickMortyApiClient from '../services/rickMortyApi.client';
import characterService from '../services/character.service';

/**
 * Cron Job: Sincronizacion de Personajes
 * 
 * Sincroniza los personajes desde la API de Rick and Morty cada 12 horas.
 * Expresion cron: 0 cada12horas - ejecuta a las 00:00 y 12:00
 * 
 * Tambien se puede ejecutar manualmente llamando a syncNow()
 */
class SyncCharactersJob {
  private job: ScheduledTask | null = null;
  private readonly CRON_EXPRESSION = '0 */12 * * *'; // Cada 12 horas
  private readonly CHARACTERS_TO_SYNC = 15;

  /**
   * Inicia el cron job
   */
  start(): void {
    if (this.job) {
      console.log('⚠️  Sync job already running');
      return;
    }

    this.job = cron.schedule(this.CRON_EXPRESSION, async () => {
      await this.syncNow();
    });

    console.log('🕐 Sync cron job started (every 12 hours)');
  }

  /**
   * Detiene el cron job
   */
  stop(): void {
    if (this.job) {
      this.job.stop();
      this.job = null;
      console.log('🛑 Sync cron job stopped');
    }
  }

  /**
   * Ejecuta la sincronización manualmente
   */
  async syncNow(): Promise<void> {
    const startTime = new Date();
    console.log(`\n🔄 [${startTime.toISOString()}] Starting character sync...`);

    try {
      // Obtener personajes de la API externa
      const characters = await rickMortyApiClient.getCharactersForDb(this.CHARACTERS_TO_SYNC);
      
      // Sincronizar con la base de datos
      const synced = await characterService.syncCharacters(characters);
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      console.log(`✅ [${endTime.toISOString()}] Synced ${synced.length} characters in ${duration}ms`);
    } catch (error) {
      const endTime = new Date();
      console.error(`❌ [${endTime.toISOString()}] Sync failed:`, (error as Error).message);
    }
  }

  /**
   * Verifica si el job está corriendo
   */
  isRunning(): boolean {
    return this.job !== null;
  }
}

// Exportar instancia singleton
export default new SyncCharactersJob();
