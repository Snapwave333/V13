export class OracleGenerator {
    // 300+ Word Pool for High Entropy
    private static readonly CYBER_POOL = [
        "ABYSS", "ACCESS", "ACID", "ACTIVE", "ADAPT", "AETHER", "AFTERMATH", "AGENCY", "ALGORITHM", "ALIGN",
        "ALPHA", "ALTITUDE", "AMPLIFY", "ANALOG", "ANCHOR", "ANOMALY", "ANTIGRAVITY", "APEX", "ARCHIVE", "ARRAY",
        "ARTIFACT", "ASH", "ASSEMBLY", "ASYMPTOTE", "ATMOSPHERE", "ATOM", "AURORA", "AUTH", "AUTO", "AVALANCHE",
        "AXIOM", "AXIS", "BACKBONE", "BANDWIDTH", "BARRIER", "BASE", "BEACON", "BEAM", "BETA", "BIAS",
        "BINARY", "BIND", "BIO", "BIT", "BLACK", "BLADE", "BLANK", "BLEED", "BLINK", "BLOCK",
        "BLOOM", "BLUE", "BODY", "BOLT", "BOND", "BONE", "BOOST", "BOOT", "BOUND", "BRAIN",
        "BREACH", "BREAK", "BRIDGE", "BRIGHT", "BROADCAST", "BUFFER", "BUILD", "BURN", "BURST", "BYPASS",
        "BYTE", "CACHE", "CALIBRATE", "CALL", "CANVAS", "CAPACITOR", "CAPTURE", "CARBON", "CARRIER", "CASCADE",
        "CELL", "CENTER", "CHAIN", "CHANNEL", "CHAOS", "CHARGE", "CHIP", "CHROME", "CIPHER", "CIRCUIT",
        "CITY", "CLAMP", "CLASH", "CLASS", "CLEAN", "CLEAR", "CLOCK", "CLOUD", "CLUSTER", "CODE",
        "COHERENCE", "COIL", "COLD", "COLLAPSE", "COLLECT", "COLLISION", "COLOR", "COMMAND", "COMPILE", "COMPLEX",
        "COMPUTE", "CONCEPT", "CONDUCT", "CONFIG", "CONNECT", "CONSOLE", "CONST", "CONSTANT", "CONSTRUCT", "CONTACT",
        "CONTAIN", "CONTEXT", "CONTROL", "CONVERGE", "COOL", "CORE", "CORONA", "CORRUPT", "COSMIC", "CRASH",
        "CREATE", "CRITICAL", "CRYPTO", "CRYSTAL", "CURRENT", "CURVE", "CYCLE", "CYPHER", "DAEMON", "DARK",
        "DATA", "DATABASE", "DAWN", "DEAD", "DEBRIS", "DEBUG", "DECAY", "DECODE", "DEEP", "DEFAULT",
        "DEFENSE", "DEFINE", "DELAY", "DELTA", "DENSITY", "DEPTH", "DESIGN", "DESTROY", "DETECT", "DEVICE",
        "DIAGNOSTIC", "DIGITAL", "DIMENSION", "DIRECT", "DIRTY", "DISC", "DISCONNECT", "DISK", "DISPLAY", "DISTORT",
        "DIVERGE", "DOMAIN", "DOPPLER", "DORMANT", "DOT", "DOUBLE", "DOWNLOAD", "DREAM", "DRIFT", "DRIVE",
        "DROP", "DROID", "DRONE", "DUAL", "DUMP", "DUST", "DYNAMIC", "ECHO", "EDGE", "EDIT",
        "EFFECT", "EJECT", "ELECTRIC", "ELEMENT", "EMIT", "EMPTY", "ENABLE", "ENCODE", "ENCRYPT", "END",
        "ENERGY", "ENGINE", "ENTER", "ENTROPY", "ENTRY", "ENVELOPE", "EPOCH", "ERROR", "ESCAPE", "ETHER",
        "EVENT", "EVOLVE", "EXECUTE", "EXIT", "EXPAND", "EXPORT", "EXTEND", "EXTERNAL", "EYE", "FADE",
        "FAIL", "FALL", "FALSE", "FAST", "FATAL", "FAULT", "FEED", "FIELD", "FILE", "FILTER",
        "FINAL", "FIRE", "FIREWALL", "FIX", "FLAG", "FLASH", "FLAT", "FLEET", "FLOAT", "FLOW",
        "FLUID", "FLUSH", "FLUX", "FOCUS", "FOG", "FORCE", "FORGE", "FORM", "FORMAT", "FRAGMENT",
        "FRAME", "FREE", "FREEZE", "FREQ", "FREQUENCY", "FRICTION", "FROZEN", "FUEL", "FULL", "FUNCTION",
        "FUSE", "FUSION", "FUTURE", "GAIN", "GALACTIC", "GALAXY", "GAME", "GAP", "GATE", "GAUGE",
        "GEAR", "GENERATE", "GHOST", "GIGABYTE", "GLARE", "GLASS", "GLITCH", "GLOBAL", "GLOW", "GOLD",
        "GRADE", "GRAIN", "GRAPH", "GRAVITY", "GRAY", "GRID", "GROUND", "GROUP", "GUARD", "GUIDE",
        "HALO", "HALT", "HARD", "HASH", "HEAD", "HEAT", "HEAVY", "HEIGHT", "HELIX", "HEX",
        "HIDDEN", "HIGH", "HIVE", "HOLD", "HOLE", "HOLO", "HOME", "HOOK", "HORIZON", "HOST",
        "HOT", "HULL", "HUMAN", "HYBRID", "HYPER", "ICON", "IDLE", "IGNITE", "IMAGE", "IMPACT",
        "IMPORT", "IMPULSE", "INDEX", "INERTIA", "INFINITE", "INFO", "INFRA", "INIT", "INJECT", "INK",
        "INPUT", "INSERT", "INSTALL", "INSTANCE", "INTEGER", "INTEGRAL", "INTERFACE", "INTERNAL", "INVERT", "ION",
        "IRON", "ISOLATE", "JACK", "JAM", "JET", "JITTER", "JOIN", "JUMP", "JUNCTION", "KERNEL",
        "KEY", "KILL", "KINETIC", "LAB", "LAG", "LASER", "LAST", "LATENCY", "LAYER", "LEAD",
        "LEAK", "LEFT", "LEGACY", "LENS", "LEVEL", "LIBRARY", "LIFE", "LIGHT", "LIMIT", "LINE",
        "LINK", "LIQUID", "LIST", "LOAD", "LOCAL", "LOCK", "LOG", "LOGIC", "LOOP", "LOST",
        "LOW", "LUMEN", "LUNAR", "MACHINE", "MACRO", "MAGNET", "MAIN", "MAKE", "MALWARE", "MAP",
        "MASK", "MASS", "MASTER", "MATRIX", "MAX", "MEAN", "MECH", "MEDIA", "MEGA", "MELT",
        "MEMORY", "MESH", "METAL", "META", "METHOD", "METRIC", "MICRO", "MID", "MIND", "MINE",
        "MIN", "MIRROR", "MISSING", "MIX", "MODE", "MODEL", "MODULE", "MONITOR", "MONO", "MOON",
        "MOTION", "MOTOR", "MOUNT", "MOUSE", "MOVE", "MUTE", "NANO", "NATIVE", "NAV", "NEAR",
        "NEBULA", "NEGATIVE", "NEON", "NETWORK", "NEURAL", "NEURON", "NEXT", "NIGHT", "NODE", "NOISE",
        "NOMAD", "NONE", "NORMAL", "NORTH", "NOTE", "NOVA", "NULL", "NUMBER", "OBJECT", "OBSERVE",
        "OCEAN", "OCTAL", "OFFSET", "OMEGA", "OMNI", "ONE", "ONLINE", "OPEN", "OPERATE", "OPTIC",
        "OPTIMAL", "ORBIT", "ORDER", "ORIGIN", "OUTPUT", "OVER", "OVERLAY", "OVERRIDE", "OXYGEN", "PACK",
        "PACKET", "PAGE", "PAINT", "PAIR", "PANEL", "PANIC", "PARA", "PARALLAX", "PARAM", "PARSE",
        "PART", "PARTICLE", "PASS", "PATH", "PAUSE", "PEAK", "PEER", "PEN", "PHASE", "PHOTO",
        "PHYSICS", "PILOT", "PING", "PIXEL", "PLAIN", "PLANE", "PLANET", "PLASMA", "PLATE", "PLAY",
        "PLOT", "PLUGIN", "POINT", "POLAR", "POLL", "POLY", "POOL", "PORT", "POS", "POST",
        "POWER", "PRE", "PRESS", "PRIMARY", "PRIME", "PRINT", "PRIORITY", "PRISM", "PRIVATE", "PROBE",
        "PROCESS", "PROFILE", "PROGRAM", "PROJECT", "PROMPT", "PROTO", "PROXY", "PUBLIC", "PULSE", "PUMP",
        "PURE", "PURGE", "PUSH", "PYRAMID", "QUANTUM", "QUERY", "QUEUE", "QUIT", "RACE", "RADAR",
        "RADIANT", "RADIO", "RADIUS", "RAID", "RAIN", "RAM", "RANGE", "RANK", "RAPID", "RATE",
        "RATIO", "RAW", "RAY", "READ", "READY", "REAL", "REBOOT", "RECEIVE", "RECORD", "RECT",
        "RED", "REDUCE", "REF", "REFRESH", "REGION", "REGISTER", "REJECT", "RELAY", "RELEASE", "RELOAD",
        "REMOTE", "REMOVE", "RENDER", "REPAIR", "REPEAT", "REPLAY", "REPORT", "REQUEST", "RESET", "RESIZE",
        "RESOLVE", "RESTORE", "RESULT", "RESUME", "RETRY", "RETURN", "REVERSE", "RGB", "RHYTHM", "RIG",
        "RIGHT", "RING", "RISE", "ROAD", "ROBOT", "ROCK", "ROGUE", "ROLL", "ROOT", "ROTATE",
        "ROTOR", "ROUTE", "ROUTER", "ROW", "RULE", "RUN", "RUSH", "RUST", "SAFE", "SALT",
        "SAMPLE", "SAND", "SAVE", "SCALE", "SCAN", "SCENE", "SCHEMA", "SCOPE", "SCORE", "SCREEN",
        "SCRIPT", "SCROLL", "SEAL", "SEARCH", "SECOND", "SECTOR", "SECURE", "SEED", "SEEK", "SEGMENT",
        "SELECT", "SELF", "SEND", "SENSOR", "SERIAL", "SERVER", "SERVICE", "SESSION", "SET", "SHADER",
        "SHADOW", "SHAPE", "SHARE", "SHARD", "SHARP", "SHELL", "SHIFT", "SHINE", "SHIP", "SHOCK",
        "SHOOT", "SHORT", "SHOW", "SHUT", "SIDE", "SIGHT", "SIGN", "SIGNAL", "SILENT", "SILICON",
        "SIMPLE", "SINE", "SINGLE", "SINK", "SITE", "SIZE", "SKIN", "SKIP", "SKY", "SLASH",
        "SLAVE", "SLEEP", "SLIDE", "SLOT", "SLOW", "SMART", "SMOKE", "SMOOTH", "SNAP", "SOCKET",
        "SOFT", "SOLAR", "SOLID", "SOLVE", "SONIC", "SORT", "SOUND", "SOURCE", "SPACE", "SPARK",
        "SPAWN", "SPEAKER", "SPEC", "SPEED", "SPHERE", "SPIKE", "SPIN", "SPLIT", "SPOT", "SPREAD",
        "SPRITE", "SQUARE", "STACK", "STAGE", "STALL", "STAR", "START", "STATE", "STATIC", "STATUS",
        "STEAM", "STEEL", "STEP", "STICK", "STOP", "STORE", "STORM", "STREAM", "STRING", "STRIP",
        "STROKE", "STRUCT", "STYLE", "SUB", "SUBJECT", "SUBMIT", "SUITE", "SUM", "SUN", "SUPER",
        "SURFACE", "SURGE", "SWAP", "SWARM", "SWEEP", "SWITCH", "SYNC", "SYNTAX", "SYSTEM", "TAB",
        "TABLE", "TAG", "TAIL", "TANK", "TAPE", "TARGET", "TASK", "TECH", "TEMP", "TEMPLATE",
        "TERRA", "TEST", "TEXT", "TEXTURE", "THEME", "THEORY", "THERMAL", "THREAD", "THRESHOLD", "THROUGH",
        "TICK", "TILE", "TIME", "TIMER", "TINT", "TITLE", "TOKEN", "TONE", "TOOL", "TOP",
        "TORCH", "TOTAL", "TOUCH", "TRACE", "TRACK", "TRAFFIC", "TRAIL", "TRAIN", "TRANS", "TRANSFER",
        "TRANSFORM", "TRANSMIT", "TRAP", "TREE", "TRIANGLE", "TRIGGER", "TRIM", "TRUE", "TUBE", "TUNE",
        "TUNNEL", "TURBO", "TURN", "TYPE", "ULTRA", "UNBIND", "UNDO", "UNIT", "UNITY", "UNKNOWN",
        "UNLOCK", "UNMOUNT", "UPDATE", "UPGRADE", "UPLOAD", "UPPER", "URI", "URL", "USAGE", "USER",
        "UTIL", "VACUUM", "VALID", "VALUE", "VALVE", "VAPOR", "VAR", "VARIABLE", "VECTOR", "VELOCITY",
        "VENDOR", "VERSION", "VERTEX", "VERTICAL", "VERY", "VIDEO", "VIEW", "VIRTUAL", "VISUAL", "VOID",
        "VOLT", "VOLUME", "VORTEX", "WAIT", "WAKE", "WALL", "WARN", "WARP", "WASH", "WATCH",
        "WAVE", "WEB", "WEIGHT", "WHEEL", "WHITE", "WIDE", "WIDGET", "WIDTH", "WIFI", "WILD",
        "WIND", "WINDOW", "WIRE", "WORD", "WORK", "WORLD", "WRAP", "WRITE", "XRAY", "YARD",
        "YEAR", "YELLOW", "YIELD", "ZERO", "ZONE", "ZOOM"
    ];

    private static readonly VERBS = [
        "RECOMBINATING", "ALIGNING", "PURGING", "FUSING", "DECRYPTING", 
        "COMPILING", "SHATTERING", "OBSERVING", "HUNTING", "BREACHING",
        "SCANNING", "INDEXING", "PARSING", "RENDERING", "UPLOADING",
        "EXECUTING", "INITIALIZING", "OPTIMIZING", "CALIBRATING", "SYNCHRONIZING"
    ];

    private static readonly QUOTES = [
        "THE SKY WAS THE COLOR OF TELEVISION TUNED TO A DEAD CHANNEL",
        "WE ARE THE GHOSTS IN THE MACHINE",
        "SILENCE IS THE LANGUAGE OF THE VOID",
        "MEMORY IS A GLITCH IN TIME",
        "SYSTEMS FAILURE IS THE ONLY TRUTH",
        "THE SIGNAL MUST FLOW",
        "ENTROPY INCREASES",
        "REBOOT. REFORM. REPEAT."
    ];

    public static generateBootMessage(): string {
        // Simple boot messages using the large pool
        const word1 = this.rand(this.CYBER_POOL);
        const word2 = this.rand(this.CYBER_POOL);
        const verb = this.rand(this.VERBS);
        
        return `${verb} ${word1}_${word2}`;
    }

    public static generateCinematicTitle(): string {
       // Director Script: 3-5 random words from the 300+ word pool
       const len = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5 words
       const words = [];
       for(let i=0; i<len; i++) {
           words.push(this.rand(this.CYBER_POOL));
       }
       
       // sometimes add a version number
       if (Math.random() > 0.7) {
           words.push(`v${Math.floor(Math.random()*9)}.${Math.floor(Math.random()*9)}`);
       }

       return words.join(" ");
    }

    private static rand(arr: string[]): string {
        return arr[Math.floor(Math.random() * arr.length)];
    }
}
