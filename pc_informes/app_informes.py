import threading
import tkinter as tk
from tkinter import ttk, messagebox
from pathlib import Path
import os
import sys

from generar_informe import cargar_config, pedir_informe, crear_excel, BASE_DIR


MESES = [
    ("01", "Enero"),
    ("02", "Febrero"),
    ("03", "Marzo"),
    ("04", "Abril"),
    ("05", "Mayo"),
    ("06", "Junio"),
    ("07", "Julio"),
    ("08", "Agosto"),
    ("09", "Septiembre"),
    ("10", "Octubre"),
    ("11", "Noviembre"),
    ("12", "Diciembre"),
]


class AppInformes(tk.Tk):
    def __init__(self):
        super().__init__()

        self.title("Yactun - Generador de Informes")
        self.geometry("520x330")
        self.resizable(False, False)

        self.archivo_generado = None

        self.crear_ui()

    def crear_ui(self):
        cont = ttk.Frame(self, padding=20)
        cont.pack(fill="both", expand=True)

        titulo = ttk.Label(
            cont,
            text="YACTUN - Generador de informes",
            font=("Segoe UI", 16, "bold")
        )
        titulo.pack(anchor="center", pady=(0, 18))

        fila_periodo = ttk.Frame(cont)
        fila_periodo.pack(fill="x", pady=8)

        ttk.Label(fila_periodo, text="Mes:").pack(side="left")
        self.mes_var = tk.StringVar(value="06")
        self.combo_mes = ttk.Combobox(
            fila_periodo,
            textvariable=self.mes_var,
            values=[f"{num} - {nombre}" for num, nombre in MESES],
            state="readonly",
            width=18
        )
        self.combo_mes.current(5)
        self.combo_mes.pack(side="left", padx=(8, 24))

        ttk.Label(fila_periodo, text="Año:").pack(side="left")
        self.anio_var = tk.StringVar(value="2026")
        self.entry_anio = ttk.Entry(fila_periodo, textvariable=self.anio_var, width=8)
        self.entry_anio.pack(side="left", padx=(8, 0))

        self.btn_generar = ttk.Button(
            cont,
            text="Generar informe",
            command=self.generar
        )
        self.btn_generar.pack(fill="x", pady=(22, 10), ipady=6)

        self.estado_var = tk.StringVar(value="Listo para generar informe.")
        self.lbl_estado = ttk.Label(
            cont,
            textvariable=self.estado_var,
            wraplength=460
        )
        self.lbl_estado.pack(anchor="w", pady=(10, 10))

        self.txt_salida = tk.Text(cont, height=5, width=58)
        self.txt_salida.pack(fill="both", expand=True)
        self.txt_salida.insert("end", "El archivo se guardará en la carpeta informes.\n")
        self.txt_salida.configure(state="disabled")

        fila_botones = ttk.Frame(cont)
        fila_botones.pack(fill="x", pady=(14, 0))

        self.btn_abrir_archivo = ttk.Button(
            fila_botones,
            text="Abrir archivo",
            command=self.abrir_archivo,
            state="disabled"
        )
        self.btn_abrir_archivo.pack(side="left", expand=True, fill="x", padx=(0, 6))

        self.btn_abrir_carpeta = ttk.Button(
            fila_botones,
            text="Abrir carpeta informes",
            command=self.abrir_carpeta
        )
        self.btn_abrir_carpeta.pack(side="left", expand=True, fill="x", padx=(6, 0))

    def log(self, texto):
        self.txt_salida.configure(state="normal")
        self.txt_salida.insert("end", texto + "\n")
        self.txt_salida.see("end")
        self.txt_salida.configure(state="disabled")

    def periodo_seleccionado(self):
        mes_txt = self.mes_var.get()
        mes = mes_txt.split(" ")[0].strip()
        anio = self.anio_var.get().strip()

        if not anio.isdigit() or len(anio) != 4:
            raise ValueError("El año debe tener 4 dígitos. Ejemplo: 2026")

        return f"{anio}-{mes}"

    def generar(self):
        try:
            periodo = self.periodo_seleccionado()
        except Exception as e:
            messagebox.showerror("Error", str(e))
            return

        self.btn_generar.configure(state="disabled")
        self.btn_abrir_archivo.configure(state="disabled")
        self.estado_var.set("Generando informe...")
        self.log(f"Solicitando informe {periodo}...")

        hilo = threading.Thread(target=self.generar_en_hilo, args=(periodo,), daemon=True)
        hilo.start()

    def generar_en_hilo(self, periodo):
        try:
            api_url, clave = cargar_config()
            data = pedir_informe(api_url, clave, periodo)
            salida = crear_excel(data, periodo)

            self.archivo_generado = Path(salida)

            self.after(0, lambda: self.generacion_ok(salida))
        except Exception as e:
            self.after(0, lambda: self.generacion_error(e))

    def generacion_ok(self, salida):
        self.estado_var.set("Informe creado correctamente.")
        self.log("Informe creado correctamente:")
        self.log(str(salida))
        self.btn_generar.configure(state="normal")
        self.btn_abrir_archivo.configure(state="normal")
        messagebox.showinfo("Informe creado", f"Archivo creado:\n{salida}")

    def generacion_error(self, error):
        self.estado_var.set("Error al generar informe.")
        self.log(f"ERROR: {error}")
        self.btn_generar.configure(state="normal")
        messagebox.showerror("Error", str(error))

    def abrir_archivo(self):
        if self.archivo_generado and self.archivo_generado.exists():
            os.startfile(self.archivo_generado)
        else:
            messagebox.showwarning("Atención", "Todavía no hay archivo generado.")

    def abrir_carpeta(self):
        carpeta = BASE_DIR / "informes"
        carpeta.mkdir(parents=True, exist_ok=True)
        os.startfile(carpeta)


def main():
    app = AppInformes()
    app.mainloop()


if __name__ == "__main__":
    main()
