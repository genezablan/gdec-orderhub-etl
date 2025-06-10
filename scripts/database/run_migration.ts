import { AppDataSource } from '../../libs/database-orderhub/src/data_source';

(async () => {
    try {
        await AppDataSource.initialize();
        console.log('DataSource initialized. Running migrations...');
        const result = await AppDataSource.runMigrations();
        console.log('Migrations complete:', result);
        await AppDataSource.destroy();
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
})();
