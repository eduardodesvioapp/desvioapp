Add-Type -AssemblyName System.Drawing
$pathIn = "d:\AG\desvio\src\assets\logo-dark.png"
$pathOut = "d:\AG\desvio\src\assets\logo-light.png"
$bmp = New-Object System.Drawing.Bitmap($pathIn)

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $pixel = $bmp.GetPixel($x, $y)
        if ($pixel.A -gt 0) {
            $r = $pixel.R
            $g = $pixel.G
            $b = $pixel.B
            
            $max = [Math]::Max($r, [Math]::Max($g, $b))
            $min = [Math]::Min($r, [Math]::Min($g, $b))
            
            # If the difference between max and min is small, it's grayscale
            if (($max - $min) -lt 40) {
                $newR = 255 - $r
                $newG = 255 - $g
                $newB = 255 - $b
                $newPixel = [System.Drawing.Color]::FromArgb($pixel.A, $newR, $newG, $newB)
                $bmp.SetPixel($x, $y, $newPixel)
            }
        }
    }
}
$bmp.Save($pathOut, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "Image processed successfully!"
