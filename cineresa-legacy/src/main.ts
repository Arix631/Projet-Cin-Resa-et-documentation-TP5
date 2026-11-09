import { buildApp, memoryAdapters } from "./container";

const PORT = process.env.PORT || 3000;
buildApp(memoryAdapters()).listen(PORT, () => console.log(`CinéResa sur http://localhost:${PORT}`));