try {
    import 'electron';
    console.log("Side Effect Import Success");
} catch (e) {
    console.error("Side Effect Import Failed:", e);
}
