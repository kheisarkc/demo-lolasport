<?php

return [
    'required' => ':attribute wajib diisi.',
    'required_if' => ':attribute wajib diisi untuk pilihan ini.',
    'required_unless' => ':attribute wajib diisi untuk metode ini.',
    'email' => 'Format :attribute tidak valid.',
    'unique' => ':attribute sudah digunakan.',
    'confirmed' => 'Konfirmasi :attribute tidak cocok.',
    'integer' => ':attribute harus bilangan bulat.',
    'in' => 'Pilihan :attribute tidak valid.',
    'exists' => ':attribute tidak ditemukan.',
    'date_format' => 'Format :attribute harus :format.',
    'after_or_equal' => ':attribute tidak boleh sebelum :date.',
    'string' => ':attribute harus berupa teks.',
    'file' => ':attribute harus berupa berkas.',
    'mimes' => ':attribute harus berjenis :values.',
    'extensions' => 'Ekstensi :attribute harus :values.',
    'min' => ['numeric' => ':attribute minimal :min.', 'string' => ':attribute minimal :min karakter.'],
    'max' => ['numeric' => ':attribute maksimal :max.', 'string' => ':attribute maksimal :max karakter.', 'file' => ':attribute maksimal :max KB.'],
    'attributes' => ['name' => 'Nama', 'email' => 'Email', 'password' => 'Kata sandi', 'proof' => 'Bukti', 'reason' => 'Alasan', 'amount' => 'Nominal', 'date' => 'Tanggal', 'hour' => 'Jam', 'duration' => 'Durasi', 'customer_name' => 'Nama pelanggan', 'to' => 'Tanggal akhir', 'from' => 'Tanggal awal'],
];
